import uuid
import time
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from backend.app.schemas import NormalizedEvent, DetectionRecord, SeverityLevel
from backend.app.detection.sigma_loader import load_all_rules
from backend.app.detection.mitre_mapper import resolve_mitre_mapping
from backend.app.storage import db

class DetectionEngine:
    def __init__(self):
        self.rules = load_all_rules()
        # Aggregation state for threshold rules: (rule_id, key) -> list of (timestamp, event_id)
        self.aggregation_state: Dict[Tuple[str, str], List[Tuple[float, str]]] = defaultdict(list)

    def reload_rules(self):
        self.rules = load_all_rules()
        return len(self.rules)

    def evaluate_events(self, events: List[NormalizedEvent]) -> List[DetectionRecord]:
        t0 = time.time()
        detections: List[DetectionRecord] = []

        for event in events:
            # 1. Evaluate single-event rules
            for rule in self.rules:
                det = rule.get("detection", {})
                selection = det.get("selection", {})
                threshold = det.get("threshold")

                if threshold:
                    # Multi-event aggregation rule (e.g. Brute force)
                    matched_base = self._matches_selection(event, selection)
                    if matched_base:
                        # Extract aggregation keys
                        keys_to_group = threshold.get("by", ["user"])
                        key_val = ":".join(str(getattr(event, k, "") or "") for k in keys_to_group)
                        
                        try:
                            # convert iso timestamp to unix seconds
                            import dateutil.parser
                            ts_sec = dateutil.parser.isoparse(event.timestamp).timestamp()
                        except Exception:
                            ts_sec = time.time()

                        state_key = (rule["id"], key_val)
                        timeframe = float(threshold.get("timeframe", 60))
                        count_target = int(threshold.get("count", 3))

                        # Purge old items
                        self.aggregation_state[state_key] = [
                            item for item in self.aggregation_state[state_key]
                            if (ts_sec - item[0]) <= timeframe
                        ]
                        self.aggregation_state[state_key].append((ts_sec, event.event_id))

                        if len(self.aggregation_state[state_key]) == count_target:
                            matched_event_ids = [item[1] for item in self.aggregation_state[state_key]]
                            record = self._build_detection_record(rule, event, matched_event_ids, f"Observed {len(matched_event_ids)} events matching threshold within {timeframe}s")
                            detections.append(record)
                else:
                    # Single event matching
                    if self._matches_selection(event, selection):
                        matched_str = f"Rule selection matched on event action '{event.action}' and process '{event.process_name}'"
                        record = self._build_detection_record(rule, event, [event.event_id], matched_str)
                        detections.append(record)

        # Store detections in DB
        for d in detections:
            db.insert_detection(d)

        duration_ms = (time.time() - t0) * 1000.0
        db.last_detection_latency = round(duration_ms, 2)
        return detections

    def _matches_selection(self, event: NormalizedEvent, selection: Dict[str, Any]) -> bool:
        if not selection:
            return False

        for field, target_val in selection.items():
            if "|" in field:
                field_name, modifier = field.split("|", 1)
            else:
                field_name, modifier = field, "exact"

            actual_val = getattr(event, field_name, None)
            if actual_val is None:
                # check additional fields
                actual_val = event.additional_fields.get(field_name)

            if actual_val is None:
                return False

            actual_str = str(actual_val).lower()

            if isinstance(target_val, list):
                targets = [str(t).lower() for t in target_val]
            else:
                targets = [str(target_val).lower()]

            if modifier == "exact":
                if not any(actual_str == t for t in targets):
                    return False
            elif modifier == "contains":
                if not any(t in actual_str for t in targets):
                    return False
            elif modifier == "startswith":
                if not any(actual_str.startswith(t) for t in targets):
                    return False
            elif modifier == "endswith":
                if not any(actual_str.endswith(t) for t in targets):
                    return False

        return True

    def _build_detection_record(
        self,
        rule: Dict[str, Any],
        trigger_event: NormalizedEvent,
        event_ids: List[str],
        matched_conditions: str
    ) -> DetectionRecord:
        tech_id = rule.get("technique_id", "T1078")
        mapping = resolve_mitre_mapping(tech_id)

        sev_map = {
            "critical": SeverityLevel.CRITICAL,
            "high": SeverityLevel.HIGH,
            "medium": SeverityLevel.MEDIUM,
            "low": SeverityLevel.LOW,
            "info": SeverityLevel.INFO
        }
        severity = sev_map.get(rule.get("severity", "medium").lower(), SeverityLevel.MEDIUM)

        confidence = 0.95 if severity == SeverityLevel.CRITICAL else (0.90 if severity == SeverityLevel.HIGH else 0.85)

        return DetectionRecord(
            detection_id=f"det-{uuid.uuid4().hex[:10]}",
            rule_id=rule.get("id", "SIGMA-RULE"),
            rule_name=rule.get("title", "Threat Rule Detected"),
            severity=severity,
            event_references=event_ids,
            matched_conditions=matched_conditions,
            technique_id=tech_id,
            technique_name=mapping["name"],
            tactic=mapping["tactic"],
            kill_chain_stage=mapping["kill_chain_stage"],
            confidence=confidence,
            timestamp=trigger_event.timestamp,
            explanation=f"{rule.get('description', '')} Detected on host {trigger_event.host or 'Unknown'} by user {trigger_event.user or 'System'}.",
            host=trigger_event.host,
            user=trigger_event.user,
            source_ip=trigger_event.source_ip,
            destination_ip=trigger_event.destination_ip
        )

detection_engine = DetectionEngine()
