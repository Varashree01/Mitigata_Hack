from typing import List, Dict, Any, Optional
from backend.app.storage import db

def get_evidence_details(event_ids: List[str]) -> List[Dict[str, Any]]:
    evidence_list = []
    for ev_id in event_ids:
        raw_event = db.get_event_by_id(ev_id)
        if raw_event:
            evidence_list.append({
                "event_id": raw_event["event_id"],
                "timestamp": raw_event["timestamp"],
                "ingestion_timestamp": raw_event["ingestion_timestamp"],
                "source": raw_event["source"],
                "source_type": raw_event["source_type"],
                "host": raw_event["host"],
                "user": raw_event["user"],
                "source_ip": raw_event["source_ip"],
                "destination_ip": raw_event["destination_ip"],
                "process_name": raw_event["process_name"],
                "command_line": raw_event["command_line"],
                "event_type": raw_event["event_type"],
                "action": raw_event["action"],
                "raw_reference": raw_event["raw_reference"],
                "additional_fields": raw_event["additional_fields"],
                "is_direct_observation": True,
                "confidence_score": 1.0,
                "audit_status": "Verifiable forensic artifact preserved in storage"
            })
    return evidence_list

def get_incident_evidence_bundle(incident_id: str) -> Dict[str, Any]:
    incident = db.get_incident(incident_id)
    if not incident:
        return {"error": "Incident not found"}

    dets = db.get_detections(incident_id=incident_id)
    rels = db.get_relationships(incident_id=incident_id)

    # Collect all event references
    all_ev_ids = set()
    for d in dets:
        for ref in d.get("event_references", []):
            all_ev_ids.add(ref)
    for r in rels:
        for ref in r.get("evidence_event_ids", []):
            all_ev_ids.add(ref)

    ev_records = get_evidence_details(list(all_ev_ids))

    return {
        "incident_id": incident_id,
        "total_evidence_events": len(ev_records),
        "total_detections": len(dets),
        "total_relationships": len(rels),
        "detections": dets,
        "relationships": rels,
        "events": ev_records
    }
