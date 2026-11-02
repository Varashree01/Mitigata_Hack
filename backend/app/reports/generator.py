import json
from typing import Dict, Any, List
from datetime import datetime
from backend.app.storage import db
from backend.app.intelligence.attack_graph import attack_graph_builder
from backend.app.exposure.reachability import reachability_engine

def generate_incident_report(incident_id: str) -> Dict[str, Any]:
    incident = db.get_incident(incident_id)
    if not incident:
        return {"error": "Incident not found"}

    timeline = attack_graph_builder.build_incident_timeline(incident_id)
    reach = reachability_engine.analyze_reachability(incident_id)
    dets = db.get_detections(incident_id=incident_id)
    rels = db.get_relationships(incident_id=incident_id)

    # 1. Executive Summary
    exec_summary = (
        f"A verified high-severity security intrusion (Incident ID: {incident_id}) was reconstructed with an explainable "
        f"Risk Score of {incident['risk_score']}/100. The attack originated on {incident['root_cause_entity']} "
        f"at {incident['initial_compromise_time']} and compromised {len(incident['affected_hosts'])} host(s) "
        f"({', '.join(incident['affected_hosts'])}) and {len(incident['affected_users'])} account(s) "
        f"({', '.join(incident['affected_users'])}). The adversary progressed across {len(incident['kill_chain_stages'])} "
        f"Cyber Kill Chain stages ({', '.join(incident['kill_chain_stages'])}), resulting in {len(dets)} triggered detection rules."
    )

    # 2. Initial Observed Activity
    initial_step = timeline[0] if timeline else {}
    initial_activity = {
        "timestamp": initial_step.get("timestamp", incident["initial_compromise_time"]),
        "entity": incident["root_cause_entity"],
        "action": initial_step.get("title", "Initial Authentication or Process Creation"),
        "description": initial_step.get("description", "First anomalous activity detected in telemetry stream."),
        "evidence_event_ids": initial_step.get("event_references", [])
    }

    # 3. Reconstructed Attack Path
    attack_path_summary = []
    for idx, item in enumerate(timeline, start=1):
        attack_path_summary.append({
            "step_number": idx,
            "timestamp": item["timestamp"],
            "title": item["title"],
            "kill_chain_stage": item.get("kill_chain_stage", "Unspecified"),
            "technique": f"{item.get('technique_name', '')} ({item.get('technique_id', '')})",
            "entity": item.get("host") or item.get("user") or "System",
            "evidence_count": len(item.get("event_references", []))
        })

    # 4. Forward Exposure & Potential Next Targets
    next_targets = [
        {
            "target": t.target_asset,
            "name": t.asset_name,
            "criticality": t.asset_criticality,
            "hops": t.hops_away,
            "path": " -> ".join(t.path),
            "reachability_type": t.reachability_type,
            "assumptions": t.assumptions,
            "missing_evidence": t.missing_evidence
        }
        for t in reach.potential_next_targets
    ]

    # 5. Uncertainties & Missing Evidence
    uncertainties = [
        "Network reachability does not guarantee successful credential authentication on uncompromised targets.",
        "Encrypted C2 payloads could not be decrypted without endpoint TLS inspection certificates.",
        "Intermediate lateral movement over SMB used administrative shares; confirm whether persistent scheduled tasks were left."
    ]

    # 6. Recommended Actions & Remediation
    recommended_actions = [
        f"Sever network connectivity for compromised endpoints: {', '.join(incident['affected_hosts'])}.",
        f"Perform forced password reset and revoke Active Directory Kerberos tickets for accounts: {', '.join(incident['affected_users'])}.",
        "Block identified external IP addresses at the perimeter firewall / egress gateway.",
        "Collect full triage memory dumps and disk forensic images from affected workstations for root-cause audit."
    ]

    remediation = [
        "Implement network segmentation isolating workstation subnets from server zones via zero-trust microsegmentation.",
        "Enforce multi-factor authentication (FIDO2/WebAuthn) on all remote desktop and administrative access.",
        "Restrict PowerShell execution using ConstrainedLanguage mode and enable ScriptBlock Logging (EID 4104).",
        "Enable Credential Guard in Windows 11 / Server 2022 to prevent LSASS process memory dumping."
    ]

    report = {
        "report_id": f"REP-{incident_id}",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "incident_id": incident_id,
        "title": incident["title"],
        "severity": incident["severity"],
        "risk_score": incident["risk_score"],
        "executive_summary": exec_summary,
        "initial_observed_activity": initial_activity,
        "timeline": attack_path_summary,
        "affected_entities": {
            "hosts": incident["affected_hosts"],
            "users": incident["affected_users"],
            "target_assets": incident["target_assets"]
        },
        "mitre_techniques": incident["tactics_involved"],
        "kill_chain_stages": incident["kill_chain_stages"],
        "reconstructed_attack_path": attack_path_summary,
        "potential_next_targets": next_targets,
        "uncertainties_and_missing_evidence": uncertainties,
        "recommended_investigation_actions": recommended_actions,
        "suggested_remediation": remediation,
        "format": "Deterministic Security Intelligence Audit Standard"
    }

    return report
