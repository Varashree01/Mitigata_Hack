from typing import List, Dict, Any
from backend.app.storage import db

TECHNIQUE_COVERAGE_MATRIX = [
    {
        "technique_id": "T1110.001",
        "technique_name": "Password Guessing",
        "tactic": "Credential Access",
        "kill_chain_stage": "Delivery",
        "required_telemetry": "Authentication Logs (Windows Security EID 4625, Linux /var/log/auth.log)",
        "available_rules": ["SIGMA-001 (Authentication Brute Force)"],
        "min_source_types": ["identity", "endpoint"]
    },
    {
        "technique_id": "T1059.001",
        "technique_name": "PowerShell Execution",
        "tactic": "Execution",
        "kill_chain_stage": "Exploitation",
        "required_telemetry": "Process Creation & Command Line (Sysmon EID 1, Windows 4688, PowerShell ScriptBlock 4104)",
        "available_rules": ["SIGMA-002 (Suspicious Encoded PowerShell)"],
        "min_source_types": ["endpoint"]
    },
    {
        "technique_id": "T1082",
        "technique_name": "System Information Discovery",
        "tactic": "Discovery",
        "kill_chain_stage": "Reconnaissance",
        "required_telemetry": "Process Creation (Sysmon EID 1, Linux auditd)",
        "available_rules": ["SIGMA-003 (System/Account Enumeration)"],
        "min_source_types": ["endpoint"]
    },
    {
        "technique_id": "T1003",
        "technique_name": "OS Credential Dumping",
        "tactic": "Credential Access",
        "kill_chain_stage": "Exploitation",
        "required_telemetry": "Process Access / Memory Inspection (Sysmon EID 10, EDR API hooking)",
        "available_rules": ["SIGMA-004 (LSASS Memory Credential Dumping)"],
        "min_source_types": ["endpoint"]
    },
    {
        "technique_id": "T1021.002",
        "technique_name": "SMB / Windows Admin Shares",
        "tactic": "Lateral Movement",
        "kill_chain_stage": "Installation",
        "required_telemetry": "Network Flow / File Share Access (Sysmon EID 3, Windows EID 5140, Zeek smb.log)",
        "available_rules": ["SIGMA-005 (Lateral Movement via SMB)"],
        "min_source_types": ["network", "endpoint"]
    },
    {
        "technique_id": "T1071.001",
        "technique_name": "Web Protocols (C2)",
        "tactic": "Command and Control",
        "kill_chain_stage": "Command and Control",
        "required_telemetry": "Network Connection / DNS / Proxy Logs (Zeek conn.log, Suricata EVE, Sysmon EID 3)",
        "available_rules": ["SIGMA-006 (C2 Outbound Beaconing)"],
        "min_source_types": ["network"]
    },
    {
        "technique_id": "T1567",
        "technique_name": "Exfiltration Over Web Service",
        "tactic": "Exfiltration",
        "kill_chain_stage": "Actions on Objectives",
        "required_telemetry": "File Transfer Logs, Web Proxy / Cloud Egress Telemetry",
        "available_rules": ["SIGMA-007 (Suspicious Data Exfiltration)"],
        "min_source_types": ["endpoint", "network"]
    },
    {
        "technique_id": "T1486",
        "technique_name": "Data Encrypted for Impact",
        "tactic": "Impact",
        "kill_chain_stage": "Actions on Objectives",
        "required_telemetry": "File Modification / Ransomware Canary (Sysmon EID 11)",
        "available_rules": [],
        "min_source_types": ["endpoint"]
    }
]

def assess_telemetry_coverage() -> Dict[str, Any]:
    # Check what log sources exist in the database
    existing_sources = set()
    try:
        rows = db.duck_conn.execute("SELECT DISTINCT source, source_type FROM events").fetchall()
        for r in rows:
            existing_sources.add((r[0].lower() if r[0] else "", r[1].lower() if r[1] else ""))
    except Exception:
        pass

    present_source_types = {st for _, st in existing_sources if st}

    matrix = []
    covered_count = 0
    partial_count = 0
    missing_count = 0

    for item in TECHNIQUE_COVERAGE_MATRIX:
        has_rules = len(item["available_rules"]) > 0
        has_telemetry = any(st in present_source_types for st in item["min_source_types"])

        if has_rules and has_telemetry:
            status = "Available"
            covered_count += 1
            limitation = "Coverage active with real-time detection rules and available logs."
        elif has_rules and not has_telemetry:
            status = "Partial"
            partial_count += 1
            limitation = f"Rules configured, but matching source types {item['min_source_types']} not yet ingested in active session."
        else:
            status = "Missing"
            missing_count += 1
            limitation = "No active detection rules loaded for this technique or specialized EDR sensor missing."

        matrix.append({
            "technique_id": item["technique_id"],
            "technique_name": item["technique_name"],
            "tactic": item["tactic"],
            "kill_chain_stage": item["kill_chain_stage"],
            "required_telemetry": item["required_telemetry"],
            "available_rules": item["available_rules"],
            "coverage_status": status,
            "visibility_limitation": limitation
        })

    total = len(matrix)
    coverage_pct = round((covered_count / total) * 100, 1) if total > 0 else 0.0

    return {
        "overall_coverage_percent": coverage_pct,
        "techniques_covered": covered_count,
        "techniques_partial": partial_count,
        "techniques_missing": missing_count,
        "total_assessed": total,
        "active_source_types": sorted(list(present_source_types)),
        "matrix": matrix
    }
