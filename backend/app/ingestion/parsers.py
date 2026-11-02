import json
import csv
import io
import re
from typing import Generator, Dict, Any, List
from pathlib import Path
from backend.app.ingestion.normalizer import normalize_event
from backend.app.schemas import NormalizedEvent

LINUX_AUTH_FAIL_REGEX = re.compile(
    r"(?P<date>[A-Z][a-z]{2}\s+\d+\s+\d+:\d+:\d+)\s+(?P<host>\S+)\s+sshd\[\d+\]:\s+Failed password for (invalid user\s+)?(?P<user>\S+) from (?P<src_ip>\d+\.\d+\.\d+\.\d+) port (?P<port>\d+)"
)
LINUX_AUTH_SUCCESS_REGEX = re.compile(
    r"(?P<date>[A-Z][a-z]{2}\s+\d+\s+\d+:\d+:\d+)\s+(?P<host>\S+)\s+sshd\[\d+\]:\s+Accepted password for (?P<user>\S+) from (?P<src_ip>\d+\.\d+\.\d+\.\d+) port (?P<port>\d+)"
)

def parse_linux_syslog_line(line: str) -> Optional[Dict[str, Any]]:
    line = line.strip()
    if not line:
        return None
    m_fail = LINUX_AUTH_FAIL_REGEX.search(line)
    if m_fail:
        gd = m_fail.groupdict()
        return {
            "timestamp": gd["date"],
            "host": gd["host"],
            "user": gd["user"],
            "source_ip": gd["src_ip"],
            "source_port": int(gd["port"]),
            "event_type": "authentication",
            "action": "logon_failed",
            "source": "linux_auth",
            "message": line
        }
    m_succ = LINUX_AUTH_SUCCESS_REGEX.search(line)
    if m_succ:
        gd = m_succ.groupdict()
        return {
            "timestamp": gd["date"],
            "host": gd["host"],
            "user": gd["user"],
            "source_ip": gd["src_ip"],
            "source_port": int(gd["port"]),
            "event_type": "authentication",
            "action": "logon_success",
            "source": "linux_auth",
            "message": line
        }
    return {
        "event_type": "syslog",
        "action": "log_entry",
        "source": "linux_syslog",
        "message": line
    }

def read_chunks_from_file(
    file_path: Path,
    chunk_size: int = 5000,
    source_hint: str = "auto"
) -> Generator[List[NormalizedEvent], None, None]:
    """
    Generator yielding batches of NormalizedEvents to prevent loading 15-50GB files into memory.
    """
    ext = file_path.suffix.lower()
    batch: List[NormalizedEvent] = []

    if ext == ".csv":
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                batch.append(normalize_event(row, default_source="csv_feed"))
                if len(batch) >= chunk_size:
                    yield batch
                    batch = []
    elif ext in [".jsonl", ".log", ".txt"]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line.startswith("{") and line.endswith("}"):
                    try:
                        data = json.loads(line)
                        batch.append(normalize_event(data, default_source="jsonl_feed"))
                    except json.JSONDecodeError:
                        parsed = parse_linux_syslog_line(line)
                        if parsed:
                            batch.append(normalize_event(parsed, default_source="syslog"))
                else:
                    parsed = parse_linux_syslog_line(line)
                    if parsed:
                        batch.append(normalize_event(parsed, default_source="syslog"))
                if len(batch) >= chunk_size:
                    yield batch
                    batch = []
    elif ext == ".json":
        # Stream read JSON objects
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(2048).strip()
            f.seek(0)
            if content.startswith("["):
                # Array of objects
                import ijson  # if installed, or standard json in chunks
                try:
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            batch.append(normalize_event(item, default_source="json_feed"))
                            if len(batch) >= chunk_size:
                                yield batch
                                batch = []
                except Exception:
                    pass
            else:
                for line in f:
                    if line.strip():
                        try:
                            data = json.loads(line)
                            batch.append(normalize_event(data, default_source="json_feed"))
                        except Exception:
                            pass
                        if len(batch) >= chunk_size:
                            yield batch
                            batch = []

    if batch:
        yield batch
