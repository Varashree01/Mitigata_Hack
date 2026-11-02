from typing import Dict, Any, Optional
from backend.app.schemas import KillChainStage

# MITRE ATT&CK v14 Enterprise Technique Catalog
MITRE_TECHNIQUE_CATALOG: Dict[str, Dict[str, Any]] = {
    "T1110": {
        "name": "Brute Force",
        "tactic": "Credential Access",
        "kill_chain_stage": KillChainStage.DELIVERY,
        "description": "Adversaries may use brute force techniques to attempt authentication."
    },
    "T1110.001": {
        "name": "Password Guessing",
        "tactic": "Credential Access",
        "kill_chain_stage": KillChainStage.DELIVERY,
        "description": "Adversaries may systematically guess passwords to gain access."
    },
    "T1078": {
        "name": "Valid Accounts",
        "tactic": "Initial Access",
        "kill_chain_stage": KillChainStage.DELIVERY,
        "description": "Adversaries may obtain and abuse credentials of existing accounts."
    },
    "T1059.001": {
        "name": "PowerShell Execution",
        "tactic": "Execution",
        "kill_chain_stage": KillChainStage.EXPLOITATION,
        "description": "Adversaries may abuse PowerShell commands and scripts for execution."
    },
    "T1059.003": {
        "name": "Windows Command Shell",
        "tactic": "Execution",
        "kill_chain_stage": KillChainStage.EXPLOITATION,
        "description": "Adversaries may abuse cmd.exe to execute hostile utility commands."
    },
    "T1082": {
        "name": "System Information Discovery",
        "tactic": "Discovery",
        "kill_chain_stage": KillChainStage.RECONNAISSANCE,
        "description": "Adversaries may attempt to get detailed information about the OS and hardware."
    },
    "T1087": {
        "name": "Account Discovery",
        "tactic": "Discovery",
        "kill_chain_stage": KillChainStage.RECONNAISSANCE,
        "description": "Adversaries may attempt to get a listing of domain or local accounts."
    },
    "T1046": {
        "name": "Network Service Discovery",
        "tactic": "Discovery",
        "kill_chain_stage": KillChainStage.RECONNAISSANCE,
        "description": "Adversaries may attempt to enumerate services running on remote hosts."
    },
    "T1003": {
        "name": "OS Credential Dumping",
        "tactic": "Credential Access",
        "kill_chain_stage": KillChainStage.EXPLOITATION,
        "description": "Adversaries may dump credentials from the LSASS memory or SAM database."
    },
    "T1021.001": {
        "name": "Remote Desktop Protocol",
        "tactic": "Lateral Movement",
        "kill_chain_stage": KillChainStage.INSTALLATION,
        "description": "Adversaries may use Valid Accounts to log into remote systems via RDP."
    },
    "T1021.002": {
        "name": "SMB/Windows Admin Shares",
        "tactic": "Lateral Movement",
        "kill_chain_stage": KillChainStage.INSTALLATION,
        "description": "Adversaries may leverage SMB shares to move laterally across network endpoints."
    },
    "T1071.001": {
        "name": "Web Protocols (C2)",
        "tactic": "Command and Control",
        "kill_chain_stage": KillChainStage.COMMAND_AND_CONTROL,
        "description": "Adversaries may communicate using application layer protocols (HTTP/HTTPS) to avoid detection."
    },
    "T1567": {
        "name": "Exfiltration Over Web Service",
        "tactic": "Exfiltration",
        "kill_chain_stage": KillChainStage.ACTIONS_ON_OBJECTIVES,
        "description": "Adversaries may exfiltrate data to cloud storage or unauthorized external endpoints."
    },
    "T1486": {
        "name": "Data Encrypted for Impact",
        "tactic": "Impact",
        "kill_chain_stage": KillChainStage.ACTIONS_ON_OBJECTIVES,
        "description": "Adversaries may encrypt data on target systems to interrupt availability."
    }
}

def resolve_mitre_mapping(technique_id: str) -> Dict[str, Any]:
    clean_id = technique_id.strip().upper()
    if clean_id in MITRE_TECHNIQUE_CATALOG:
        return MITRE_TECHNIQUE_CATALOG[clean_id]
    
    # Check parent ID if sub-technique
    parent_id = clean_id.split(".")[0]
    if parent_id in MITRE_TECHNIQUE_CATALOG:
        return MITRE_TECHNIQUE_CATALOG[parent_id]

    return {
        "name": f"Suspicious Activity ({clean_id})",
        "tactic": "Tactics Unclassified",
        "kill_chain_stage": KillChainStage.EXPLOITATION,
        "description": "Technique unmapped in local catalog."
    }
