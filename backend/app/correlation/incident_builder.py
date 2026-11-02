import uuid
import time
from typing import List, Dict, Any, Set
from datetime import datetime
from backend.app.schemas import (
    NormalizedEvent, DetectionRecord, IncidentRecord,
    EntityRelationship, SeverityLevel
)
from backend.app.correlation.entity_resolver import (
    clean_hostname, clean_username, extract_relationships_from_event
)
from backend.app.storage import db

class CorrelationEngine:
    def __init__(self):
        # Maps entity (e.g. "host:HR-07" or "user:jdoe") -> active incident_id
        self.entity_to_incident: Dict[str, str] = {}
        # incident_id -> list of detection_ids
        self.incident_detections: Dict[str, List[str]] = {}
        # incident_id -> set of event_ids
        self.incident_events: Dict[str, Set[str]] = {}
        # incident_id -> list of EntityRelationship
        self.incident_relationships: Dict[str, List[EntityRelationship]] = {}

    def correlate_batch(self, events: List[NormalizedEvent], detections: List[DetectionRecord]) -> List[IncidentRecord]:
        t0 = time.time()
        updated_incidents: List[IncidentRecord] = []

        # 1. Process detections to find or create incidents
        for det in detections:
            matched_incident_id = None
            candidate_entities = []
            if det.host:
                candidate_entities.append(f"host:{clean_hostname(det.host)}")
            if det.user:
                candidate_entities.append(f"user:{clean_username(det.user)}")
            if det.source_ip:
                candidate_entities.append(f"ip:{det.source_ip}")

            # Check if any candidate entity belongs to an active incident
            for ent in candidate_entities:
                if ent in self.entity_to_incident:
                    matched_incident_id = self.entity_to_incident[ent]
                    break

            # If no existing incident, create new incident
            if not matched_incident_id:
                matched_incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
                self.incident_detections[matched_incident_id] = []
                self.incident_events[matched_incident_id] = set()
                self.incident_relationships[matched_incident_id] = []

            # Bind entities to this incident
            for ent in candidate_entities:
                self.entity_to_incident[ent] = matched_incident_id

            self.incident_detections[matched_incident_id].append(det.detection_id)
            for ev_id in det.event_references:
                self.incident_events[matched_incident_id].add(ev_id)

            # Update DB with incident_id on detection
            db.sqlite_conn.execute("UPDATE detections SET incident_id = ? WHERE detection_id = ?", (matched_incident_id, det.detection_id))

        # 2. Extract entity relationships from events that belong to known incidents
        for ev in events:
            h = clean_hostname(ev.host)
            u = clean_username(ev.user)
            inc_id = None
            if h and f"host:{h}" in self.entity_to_incident:
                inc_id = self.entity_to_incident[f"host:{h}"]
            elif u and f"user:{u}" in self.entity_to_incident:
                inc_id = self.entity_to_incident[f"user:{u}"]

            if inc_id:
                self.incident_events[inc_id].add(ev.event_id)
                rels = extract_relationships_from_event(ev)
                for r in rels:
                    self.incident_relationships[inc_id].append(r)
                    db.insert_relationship(inc_id, r)

        # 3. Rebuild / Update incident records
        all_active_inc_ids = list(self.incident_detections.keys())
        for inc_id in all_active_inc_ids:
            inc_record = self._build_incident_record(inc_id)
            db.insert_incident(inc_record)
            updated_incidents.append(inc_record)

        duration_ms = (time.time() - t0) * 1000.0
        db.last_correlation_latency = round(duration_ms, 2)
        return updated_incidents

    def _build_incident_record(self, incident_id: str) -> IncidentRecord:
        det_ids = self.incident_detections.get(incident_id, [])
        all_dets = db.get_detections(incident_id=incident_id)

        affected_hosts = set()
        affected_users = set()
        tactics = set()
        kill_chains = set()
        highest_severity = SeverityLevel.LOW
        severities = []
        timestamps = []

        sev_order = {
            SeverityLevel.INFO: 1,
            SeverityLevel.LOW: 2,
            SeverityLevel.MEDIUM: 3,
            SeverityLevel.HIGH: 4,
            SeverityLevel.CRITICAL: 5
        }

        for d in all_dets:
            if d.get("host"):
                affected_hosts.add(clean_hostname(d["host"]))
            if d.get("user"):
                affected_users.add(clean_username(d["user"]))
            if d.get("tactic"):
                tactics.add(d["tactic"])
            if d.get("kill_chain_stage"):
                kill_chains.add(d["kill_chain_stage"])
            if d.get("timestamp"):
                timestamps.append(d["timestamp"])

            sev_val = SeverityLevel(d.get("severity", "low").lower())
            severities.append(sev_val)
            if sev_order.get(sev_val, 1) > sev_order.get(highest_severity, 1):
                highest_severity = sev_val

        timestamps.sort()
        initial_ts = timestamps[0] if timestamps else datetime.utcnow().isoformat() + "Z"
        latest_ts = timestamps[-1] if timestamps else initial_ts

        hosts_list = sorted(list(affected_hosts))
        users_list = sorted(list(affected_users))
        root_cause = hosts_list[0] if hosts_list else (users_list[0] if users_list else "Unknown Entity")

        # Calculate Explainable Risk Score (0-100)
        # Factor A: Severity weight (up to 40)
        sev_weight = {
            SeverityLevel.CRITICAL: 40.0,
            SeverityLevel.HIGH: 28.0,
            SeverityLevel.MEDIUM: 16.0,
            SeverityLevel.LOW: 8.0,
            SeverityLevel.INFO: 2.0
        }.get(highest_severity, 10.0)

        # Factor B: Kill chain progression (up to 30) - 5 points per unique stage
        kc_score = min(30.0, len(kill_chains) * 5.0)

        # Factor C: Entity blast radius (up to 20) - 5 points per host, 3 per user
        ent_score = min(20.0, (len(hosts_list) * 5.0) + (len(users_list) * 3.0))

        # Factor D: High-impact techniques (up to 10)
        impact_bonus = 10.0 if any(k in ["Actions on Objectives", "Lateral Movement"] for k in kill_chains) else 0.0

        total_risk = round(min(100.0, sev_weight + kc_score + ent_score + impact_bonus), 1)

        # Generate descriptive title
        primary_tactic = list(tactics)[0] if tactics else "Intrusion"
        title = f"Multi-Stage Attack: {primary_tactic} via {root_cause} traversing {len(hosts_list)} host(s)"
        desc = (
            f"Correlated incident involving {len(det_ids)} rule detections across {len(hosts_list)} host(s) "
            f"and {len(users_list)} user account(s). Kill chain progressed through {', '.join(sorted(kill_chains))}."
        )

        return IncidentRecord(
            incident_id=incident_id,
            title=title,
            description=desc,
            severity=highest_severity,
            risk_score=total_risk,
            initial_compromise_time=initial_ts,
            latest_activity_time=latest_ts,
            root_cause_entity=root_cause,
            affected_hosts=hosts_list,
            affected_users=users_list,
            target_assets=[h for h in hosts_list if any(srv in h.lower() for srv in ["dc", "srv", "sql", "db", "file"])],
            detection_ids=det_ids,
            event_count=len(self.incident_events.get(incident_id, set())),
            raw_alerts_merged=len(det_ids),
            tactics_involved=sorted(list(tactics)),
            kill_chain_stages=sorted(list(kill_chains)),
            status="active"
        )

correlation_engine = CorrelationEngine()
