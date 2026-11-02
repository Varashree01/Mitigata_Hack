import re
from typing import Optional, Tuple, Dict, Any
from backend.app.schemas import NormalizedEvent, EntityRelationship

def clean_username(user: Optional[str]) -> Optional[str]:
    if not user:
        return None
    u = str(user).strip().lower()
    if "\\" in u:
        u = u.split("\\")[-1]
    if "@" in u:
        u = u.split("@")[0]
    if u in ["-", "system", "local service", "network service", "anonymous logon"]:
        return None
    return u

def clean_hostname(host: Optional[str]) -> Optional[str]:
    if not host:
        return None
    h = str(host).strip().upper()
    if "." in h and not re.match(r"^\d+\.\d+\.\d+\.\d+$", h):
        h = h.split(".")[0]
    return h

def extract_relationships_from_event(event: NormalizedEvent) -> list[EntityRelationship]:
    """
    Extracts high-fidelity entity relationships with verifiable event provenance.
    """
    relationships: list[EntityRelationship] = []
    host = clean_hostname(event.host)
    user = clean_username(event.user)
    src_ip = event.source_ip
    dst_ip = event.destination_ip

    # 1. User Authenticated to Host
    if user and host and event.event_type == "authentication" and event.action in ["logon_success", "special_privilege_assigned"]:
        relationships.append(EntityRelationship(
            source_entity=user,
            source_type="user",
            target_entity=host,
            target_type="host",
            relationship_type="AUTHENTICATED_TO",
            evidence_event_ids=[event.event_id],
            confidence=0.98,
            timestamp=event.timestamp,
            is_inferred=False
        ))

    # 2. Process Executed on Host
    if event.process_name and host:
        relationships.append(EntityRelationship(
            source_entity=event.process_name,
            source_type="process",
            target_entity=host,
            target_type="host",
            relationship_type="EXECUTED_ON",
            evidence_event_ids=[event.event_id],
            confidence=0.99,
            timestamp=event.timestamp,
            is_inferred=False
        ))

    # 3. Parent Process Created Child Process
    if event.parent_process and event.process_name and event.parent_process != event.process_name:
        relationships.append(EntityRelationship(
            source_entity=event.parent_process,
            source_type="process",
            target_entity=event.process_name,
            target_type="process",
            relationship_type="SPAWNED_PROCESS",
            evidence_event_ids=[event.event_id],
            confidence=0.95,
            timestamp=event.timestamp,
            is_inferred=False
        ))

    # 4. Host Connected to Destination IP/Host
    if host and dst_ip and event.event_type in ["network_connection", "c2_beacon", "data_exfiltration"]:
        relationships.append(EntityRelationship(
            source_entity=host,
            source_type="host",
            target_entity=dst_ip,
            target_type="ip",
            relationship_type="CONNECTED_TO",
            evidence_event_ids=[event.event_id],
            confidence=0.92,
            timestamp=event.timestamp,
            is_inferred=False
        ))

    # 5. IP Authenticated or Attempted Access to Host
    if src_ip and host and event.event_type == "authentication":
        rel_type = "AUTHENTICATED_TO" if event.action == "logon_success" else "ATTEMPTED_ACCESS"
        relationships.append(EntityRelationship(
            source_entity=src_ip,
            source_type="ip",
            target_entity=host,
            target_type="host",
            relationship_type=rel_type,
            evidence_event_ids=[event.event_id],
            confidence=0.90,
            timestamp=event.timestamp,
            is_inferred=False
        ))

    return relationships
