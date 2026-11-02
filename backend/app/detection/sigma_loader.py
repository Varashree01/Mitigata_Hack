import yaml
import json
from pathlib import Path
from typing import List, Dict, Any
from backend.app.config import RULES_DIR
from backend.app.schemas import SeverityLevel

DEFAULT_SIGMA_RULES = [
    {
        "id": "SIGMA-001",
        "title": "Authentication Brute Force Guessing",
        "severity": "high",
        "description": "Detects high-frequency failed authentications on an account within a short temporal window.",
        "tags": ["attack.credential_access", "attack.t1110.001"],
        "technique_id": "T1110.001",
        "logsource": {"category": "authentication"},
        "detection": {
            "selection": {
                "action": ["logon_failed", "authentication_failure"]
            },
            "condition": "selection",
            "threshold": {
                "count": 3,
                "timeframe": 60,
                "by": ["user", "source_ip"]
            }
        }
    },
    {
        "id": "SIGMA-002",
        "title": "Suspicious Encoded PowerShell Execution",
        "severity": "critical",
        "description": "Detects PowerShell execution with base64 encoded command or bypass flags.",
        "tags": ["attack.execution", "attack.t1059.001"],
        "technique_id": "T1059.001",
        "logsource": {"category": "process_creation"},
        "detection": {
            "selection": {
                "process_name": ["powershell.exe", "pwsh.exe"],
                "command_line|contains": ["-enc", "-encodedcommand", "downloadstring", "iex", "bypass"]
            },
            "condition": "selection"
        }
    },
    {
        "id": "SIGMA-003",
        "title": "System and Account Enumeration Discovery",
        "severity": "medium",
        "description": "Detects reconnaissance utilities executed to discover users, domain controllers, and host configs.",
        "tags": ["attack.discovery", "attack.t1082", "attack.t1087"],
        "technique_id": "T1082",
        "logsource": {"category": "process_creation"},
        "detection": {
            "selection": {
                "process_name": ["whoami.exe", "net.exe", "net1.exe", "nltest.exe", "systeminfo.exe", "ipconfig.exe"],
                "command_line|contains": ["/domain", "user", "group", "all"]
            },
            "condition": "selection"
        }
    },
    {
        "id": "SIGMA-004",
        "title": "LSASS Memory Credential Dumping Attempt",
        "severity": "critical",
        "description": "Detects attempts to access LSASS process memory using procdump, mimikatz, or comsvcs.dll.",
        "tags": ["attack.credential_access", "attack.t1003"],
        "technique_id": "T1003",
        "logsource": {"category": "process_creation"},
        "detection": {
            "selection": {
                "command_line|contains": ["procdump", "lsass", "sekurlsa", "minidump", "comsvcs.dll"]
            },
            "condition": "selection"
        }
    },
    {
        "id": "SIGMA-005",
        "title": "Lateral Movement via SMB and Admin Shares",
        "severity": "high",
        "description": "Detects suspicious remote service execution or administrative share access across hosts.",
        "tags": ["attack.lateral_movement", "attack.t1021.002"],
        "technique_id": "T1021.002",
        "logsource": {"category": "network_connection"},
        "detection": {
            "selection": {
                "destination_port": [445, 139, 135],
                "action": ["network_connected", "share_accessed", "remote_ipc"]
            },
            "condition": "selection"
        }
    },
    {
        "id": "SIGMA-006",
        "title": "Command and Control Outbound Beaconing",
        "severity": "high",
        "description": "Detects recurring outbound connections to suspicious external C2 IP addresses.",
        "tags": ["attack.command_and_control", "attack.t1071.001"],
        "technique_id": "T1071.001",
        "logsource": {"category": "network_connection"},
        "detection": {
            "selection": {
                "destination_port": [4444, 8080, 8443, 9001],
                "action": ["network_connected", "beacon"]
            },
            "condition": "selection"
        }
    },
    {
        "id": "SIGMA-007",
        "title": "Suspicious Data Exfiltration to External Endpoint",
        "severity": "critical",
        "description": "Detects high volume archive uploads or anomalous file staging to external web endpoints.",
        "tags": ["attack.exfiltration", "attack.t1567"],
        "technique_id": "T1567",
        "logsource": {"category": "file_access"},
        "detection": {
            "selection": {
                "action": ["data_upload", "archive_exfil", "file_transferred"],
                "command_line|contains": ["rclone", "curl", "mega.nz", "dropbox", "s3", "7z"]
            },
            "condition": "selection"
        }
    }
]

def ensure_default_rules():
    RULES_DIR.mkdir(parents=True, exist_ok=True)
    for rule in DEFAULT_SIGMA_RULES:
        rule_path = RULES_DIR / f"{rule['id']}.yaml"
        if not rule_path.exists():
            with open(rule_path, "w", encoding="utf-8") as f:
                yaml.dump(rule, f, sort_keys=False)

def load_all_rules() -> List[Dict[str, Any]]:
    ensure_default_rules()
    rules = []
    for f in RULES_DIR.glob("*.yaml"):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                data = yaml.safe_load(fp)
                if isinstance(data, dict) and "id" in data:
                    rules.append(data)
        except Exception:
            continue
    for f in RULES_DIR.glob("*.json"):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                if isinstance(data, dict) and "id" in data:
                    rules.append(data)
        except Exception:
            continue
    return rules
