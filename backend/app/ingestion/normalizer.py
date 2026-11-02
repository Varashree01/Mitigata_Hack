import uuid
import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from backend.app.schemas import NormalizedEvent

def parse_iso_timestamp(ts_str: Any) -> str:
    if not ts_str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    if isinstance(ts_str, (int, float)):
        # Handle unix epoch timestamp (seconds or milliseconds)
        if ts_str > 1e11:
            ts_str = ts_str / 1000.0
        return datetime.fromtimestamp(ts_str, tz=timezone.utc).isoformat().replace("+00:00", "Z")
    
    s = str(ts_str).strip()
    # Try various formats
    formats = [
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
        "%b %d %H:%M:%S",
        "%d/%b/%Y:%H:%M:%S"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            if dt.year == 1900:  # syslog without year
                dt = dt.replace(year=datetime.now().year)
            return dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        except ValueError:
            continue
    # Default fallback
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def normalize_event(raw: Dict[str, Any], default_source: str = "generic") -> NormalizedEvent:
    # 1. Determine Event ID
    event_id = str(raw.get("event_id") or raw.get("id") or raw.get("RecordId") or str(uuid.uuid4()))
    
    # 2. Extract Timestamp
    ts_val = (
        raw.get("timestamp") or raw.get("@timestamp") or raw.get("TimeCreated") or
        raw.get("EventTime") or raw.get("date") or raw.get("time") or raw.get("ts")
    )
    timestamp = parse_iso_timestamp(ts_val)

    # 3. Source & Source Type
    source = raw.get("source") or raw.get("Channel") or raw.get("log_type") or default_source
    source_type = raw.get("source_type") or "endpoint"
    if any(k in source.lower() for k in ["zeek", "suricata", "firewall", "netflow", "conn"]):
        source_type = "network"
    elif any(k in source.lower() for k in ["auth", "login", "identity", "okta", "ad"]):
        source_type = "identity"

    # 4. Host & User
    host = (
        raw.get("host") or raw.get("Computer") or raw.get("ComputerName") or
        raw.get("hostname") or raw.get("endpoint") or raw.get("system")
    )
    if host:
        host = str(host).strip().upper()

    user = (
        raw.get("user") or raw.get("TargetUserName") or raw.get("SubjectUserName") or
        raw.get("username") or raw.get("account") or raw.get("User")
    )
    if user:
        user = str(user).strip().lower()
        if "\\" in user:
            user = user.split("\\")[-1]
        if "@" in user:
            user = user.split("@")[0]
        if user in ["-", "system", "anonymous logon"]:
            user = None

    # 5. IP Addresses
    src_ip = raw.get("source_ip") or raw.get("src_ip") or raw.get("IpAddress") or raw.get("id.orig_h") or raw.get("c_ip")
    dst_ip = raw.get("destination_ip") or raw.get("dest_ip") or raw.get("dst_ip") or raw.get("DestinationIp") or raw.get("id.resp_h")
    src_port = raw.get("source_port") or raw.get("src_port") or raw.get("IpPort") or raw.get("id.orig_p")
    dst_port = raw.get("destination_port") or raw.get("dest_port") or raw.get("dst_port") or raw.get("DestinationPort") or raw.get("id.resp_p")

    # 6. Process information
    process_name = raw.get("process_name") or raw.get("Image") or raw.get("process") or raw.get("ProcessName") or raw.get("exe")
    if process_name and ("\\" in process_name or "/" in process_name):
        clean_proc = process_name.replace("\\", "/").split("/")[-1]
    else:
        clean_proc = process_name

    parent_process = raw.get("parent_process") or raw.get("ParentImage") or raw.get("parent") or raw.get("ParentProcessName")
    if parent_process and ("\\" in parent_process or "/" in parent_process):
        clean_parent = parent_process.replace("\\", "/").split("/")[-1]
    else:
        clean_parent = parent_process

    cmd_line = raw.get("command_line") or raw.get("CommandLine") or raw.get("cmd") or raw.get("args")

    # 7. Action / Event Type
    event_type = raw.get("event_type") or "system"
    action = raw.get("action") or raw.get("EventID") or "observed"

    # Specific Windows Event ID Mapping
    event_code = str(raw.get("EventID") or raw.get("EventCode") or "")
    if event_code == "4624":
        event_type = "authentication"
        action = "logon_success"
    elif event_code == "4625":
        event_type = "authentication"
        action = "logon_failed"
    elif event_code == "4672":
        event_type = "privilege"
        action = "special_privilege_assigned"
    elif event_code in ["1", "4688"]:
        event_type = "process_creation"
        action = "process_created"
    elif event_code in ["3", "5156"]:
        event_type = "network_connection"
        action = "network_connected"

    # Raw reference & preserve additional fields
    raw_ref = str(raw.get("raw") or raw.get("message") or f"{event_type}:{action}")
    additional = {k: v for k, v in raw.items() if k not in [
        "event_id", "timestamp", "host", "user", "source_ip", "destination_ip",
        "source_port", "destination_port", "process_name", "parent_process", "command_line"
    ]}

    return NormalizedEvent(
        event_id=event_id,
        timestamp=timestamp,
        source=str(source),
        source_type=str(source_type),
        host=host,
        user=user,
        source_ip=str(src_ip) if src_ip else None,
        destination_ip=str(dst_ip) if dst_ip else None,
        source_port=int(src_port) if src_port and str(src_port).isdigit() else None,
        destination_port=int(dst_port) if dst_port and str(dst_port).isdigit() else None,
        process_name=clean_proc,
        process_path=process_name if process_name != clean_proc else None,
        parent_process=clean_parent,
        command_line=str(cmd_line) if cmd_line else None,
        event_type=str(event_type),
        action=str(action),
        raw_reference=raw_ref,
        additional_fields=additional
    )
