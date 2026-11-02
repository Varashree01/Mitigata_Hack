import duckdb
import sqlite3
import json
import psutil
import time
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from backend.app.config import DUCKDB_PATH, SQLITE_PATH, PARQUET_DIR
from backend.app.schemas import (
    NormalizedEvent, DetectionRecord, IncidentRecord,
    EntityRelationship, IngestionRun, SystemTelemetry
)

class StorageManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StorageManager, cls).__new__(cls)
            cls._instance._init_storage()
        return cls._instance

    def _init_storage(self):
        # 1. Initialize SQLite for relational index storage (incidents, detections, relations)
        self.sqlite_conn = sqlite3.connect(str(SQLITE_PATH), check_same_thread=False)
        self.sqlite_conn.row_factory = sqlite3.Row
        self._create_sqlite_tables()

        # 2. Initialize DuckDB for analytical column queries & streaming log batches
        self.duck_conn = duckdb.connect(str(DUCKDB_PATH))
        self._create_duckdb_tables()

        # 3. Telemetry in-memory counters
        self.total_received = 0
        self.total_processed = 0
        self.total_dropped = 0
        self.last_proc_timestamp = time.time()
        self.last_events_processed = 0
        self.current_eps = 0.0
        self.last_detection_latency = 12.4
        self.last_correlation_latency = 18.2

    def _create_sqlite_tables(self):
        with self.sqlite_conn:
            self.sqlite_conn.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                incident_id TEXT PRIMARY KEY,
                title TEXT,
                description TEXT,
                severity TEXT,
                risk_score REAL,
                initial_compromise_time TEXT,
                latest_activity_time TEXT,
                root_cause_entity TEXT,
                affected_hosts TEXT,
                affected_users TEXT,
                target_assets TEXT,
                detection_ids TEXT,
                event_count INTEGER,
                raw_alerts_merged INTEGER,
                tactics_involved TEXT,
                kill_chain_stages TEXT,
                status TEXT
            )
            """)
            self.sqlite_conn.execute("""
            CREATE TABLE IF NOT EXISTS detections (
                detection_id TEXT PRIMARY KEY,
                rule_id TEXT,
                rule_name TEXT,
                severity TEXT,
                event_references TEXT,
                matched_conditions TEXT,
                technique_id TEXT,
                technique_name TEXT,
                tactic TEXT,
                kill_chain_stage TEXT,
                confidence REAL,
                timestamp TEXT,
                explanation TEXT,
                host TEXT,
                user TEXT,
                source_ip TEXT,
                destination_ip TEXT,
                incident_id TEXT
            )
            """)
            self.sqlite_conn.execute("""
            CREATE TABLE IF NOT EXISTS relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT,
                source_entity TEXT,
                source_type TEXT,
                target_entity TEXT,
                target_type TEXT,
                relationship_type TEXT,
                evidence_event_ids TEXT,
                confidence REAL,
                timestamp TEXT,
                is_inferred INTEGER
            )
            """)
            self.sqlite_conn.execute("""
            CREATE TABLE IF NOT EXISTS ingestion_runs (
                run_id TEXT PRIMARY KEY,
                filename TEXT,
                source_type TEXT,
                total_events INTEGER,
                processed_events INTEGER,
                dropped_events INTEGER,
                duration_seconds REAL,
                status TEXT,
                created_at TEXT
            )
            """)

    def _create_duckdb_tables(self):
        self.duck_conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            event_id VARCHAR PRIMARY KEY,
            timestamp VARCHAR,
            ingestion_timestamp VARCHAR,
            source VARCHAR,
            source_type VARCHAR,
            host VARCHAR,
            user VARCHAR,
            source_ip VARCHAR,
            destination_ip VARCHAR,
            source_port INTEGER,
            destination_port INTEGER,
            process_name VARCHAR,
            process_path VARCHAR,
            parent_process VARCHAR,
            command_line VARCHAR,
            event_type VARCHAR,
            action VARCHAR,
            raw_reference VARCHAR,
            additional_fields VARCHAR
        )
        """)
        # Index on timestamp & entities for speed
        self.duck_conn.execute("CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp)")
        self.duck_conn.execute("CREATE INDEX IF NOT EXISTS idx_events_host ON events(host)")
        self.duck_conn.execute("CREATE INDEX IF NOT EXISTS idx_events_user ON events(user)")

    def insert_events_batch(self, events: List[NormalizedEvent]):
        if not events:
            return
        self.total_received += len(events)
        rows = [
            (
                e.event_id, e.timestamp, e.ingestion_timestamp, e.source, e.source_type,
                e.host, e.user, e.source_ip, e.destination_ip, e.source_port,
                e.destination_port, e.process_name, e.process_path, e.parent_process,
                e.command_line, e.event_type, e.action, e.raw_reference,
                json.dumps(e.additional_fields)
            )
            for e in events
        ]
        self.duck_conn.executemany("""
            INSERT OR REPLACE INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rows)
        self.total_processed += len(events)
        self._update_eps()

    def _update_eps(self):
        now = time.time()
        elapsed = now - self.last_proc_timestamp
        if elapsed >= 1.0:
            diff = self.total_processed - self.last_events_processed
            self.current_eps = round(diff / elapsed, 1)
            self.last_proc_timestamp = now
            self.last_events_processed = self.total_processed

    def get_events(self, limit: int = 100, offset: int = 0, host: Optional[str] = None, user: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM events WHERE 1=1"
        params = []
        if host:
            query += " AND host = ?"
            params.append(host)
        if user:
            query += " AND user = ?"
            params.append(user)
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        res = self.duck_conn.execute(query, params).fetchall()
        cols = [
            "event_id", "timestamp", "ingestion_timestamp", "source", "source_type",
            "host", "user", "source_ip", "destination_ip", "source_port",
            "destination_port", "process_name", "process_path", "parent_process",
            "command_line", "event_type", "action", "raw_reference", "additional_fields"
        ]
        out = []
        for r in res:
            d = dict(zip(cols, r))
            try:
                d["additional_fields"] = json.loads(d["additional_fields"]) if d["additional_fields"] else {}
            except Exception:
                d["additional_fields"] = {}
            out.append(d)
        return out

    def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        res = self.duck_conn.execute("SELECT * FROM events WHERE event_id = ?", [event_id]).fetchone()
        if not res:
            return None
        cols = [
            "event_id", "timestamp", "ingestion_timestamp", "source", "source_type",
            "host", "user", "source_ip", "destination_ip", "source_port",
            "destination_port", "process_name", "process_path", "parent_process",
            "command_line", "event_type", "action", "raw_reference", "additional_fields"
        ]
        d = dict(zip(cols, res))
        try:
            d["additional_fields"] = json.loads(d["additional_fields"]) if d["additional_fields"] else {}
        except Exception:
            d["additional_fields"] = {}
        return d

    def insert_detection(self, det: DetectionRecord, incident_id: Optional[str] = None):
        with self.sqlite_conn:
            self.sqlite_conn.execute("""
            INSERT OR REPLACE INTO detections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                det.detection_id, det.rule_id, det.rule_name, det.severity.value,
                json.dumps(det.event_references), det.matched_conditions,
                det.technique_id, det.technique_name, det.tactic,
                det.kill_chain_stage.value, det.confidence, det.timestamp,
                det.explanation, det.host, det.user, det.source_ip,
                det.destination_ip, incident_id
            ))

    def get_detections(self, incident_id: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
        cur = self.sqlite_conn.cursor()
        if incident_id:
            cur.execute("SELECT * FROM detections WHERE incident_id = ? ORDER BY timestamp DESC LIMIT ?", (incident_id, limit))
        else:
            cur.execute("SELECT * FROM detections ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cur.fetchall()
        out = []
        for r in rows:
            d = dict(r)
            d["event_references"] = json.loads(d["event_references"]) if d["event_references"] else []
            out.append(d)
        return out

    def insert_incident(self, inc: IncidentRecord):
        with self.sqlite_conn:
            self.sqlite_conn.execute("""
            INSERT OR REPLACE INTO incidents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                inc.incident_id, inc.title, inc.description, inc.severity.value,
                inc.risk_score, inc.initial_compromise_time, inc.latest_activity_time,
                inc.root_cause_entity, json.dumps(inc.affected_hosts),
                json.dumps(inc.affected_users), json.dumps(inc.target_assets),
                json.dumps(inc.detection_ids), inc.event_count, inc.raw_alerts_merged,
                json.dumps(inc.tactics_involved), json.dumps(inc.kill_chain_stages),
                inc.status
            ))

    def get_incidents(self) -> List[Dict[str, Any]]:
        cur = self.sqlite_conn.cursor()
        cur.execute("SELECT * FROM incidents ORDER BY risk_score DESC")
        rows = cur.fetchall()
        out = []
        for r in rows:
            d = dict(r)
            d["affected_hosts"] = json.loads(d["affected_hosts"]) if d["affected_hosts"] else []
            d["affected_users"] = json.loads(d["affected_users"]) if d["affected_users"] else []
            d["target_assets"] = json.loads(d["target_assets"]) if d["target_assets"] else []
            d["detection_ids"] = json.loads(d["detection_ids"]) if d["detection_ids"] else []
            d["tactics_involved"] = json.loads(d["tactics_involved"]) if d["tactics_involved"] else []
            d["kill_chain_stages"] = json.loads(d["kill_chain_stages"]) if d["kill_chain_stages"] else []
            out.append(d)
        return out

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        cur = self.sqlite_conn.cursor()
        cur.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,))
        row = cur.fetchone()
        if not row:
            return None
        d = dict(row)
        d["affected_hosts"] = json.loads(d["affected_hosts"]) if d["affected_hosts"] else []
        d["affected_users"] = json.loads(d["affected_users"]) if d["affected_users"] else []
        d["target_assets"] = json.loads(d["target_assets"]) if d["target_assets"] else []
        d["detection_ids"] = json.loads(d["detection_ids"]) if d["detection_ids"] else []
        d["tactics_involved"] = json.loads(d["tactics_involved"]) if d["tactics_involved"] else []
        d["kill_chain_stages"] = json.loads(d["kill_chain_stages"]) if d["kill_chain_stages"] else []
        return d

    def insert_relationship(self, incident_id: str, rel: EntityRelationship):
        with self.sqlite_conn:
            self.sqlite_conn.execute("""
            INSERT INTO relationships (
                incident_id, source_entity, source_type, target_entity, target_type,
                relationship_type, evidence_event_ids, confidence, timestamp, is_inferred
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                incident_id, rel.source_entity, rel.source_type, rel.target_entity, rel.target_type,
                rel.relationship_type, json.dumps(rel.evidence_event_ids), rel.confidence,
                rel.timestamp, 1 if rel.is_inferred else 0
            ))

    def get_relationships(self, incident_id: str) -> List[Dict[str, Any]]:
        cur = self.sqlite_conn.cursor()
        cur.execute("SELECT * FROM relationships WHERE incident_id = ? ORDER BY timestamp ASC", (incident_id,))
        rows = cur.fetchall()
        out = []
        for r in rows:
            d = dict(r)
            d["evidence_event_ids"] = json.loads(d["evidence_event_ids"]) if d["evidence_event_ids"] else []
            d["is_inferred"] = bool(d["is_inferred"])
            out.append(d)
        return out

    def record_ingestion_run(self, run: IngestionRun):
        with self.sqlite_conn:
            self.sqlite_conn.execute("""
            INSERT OR REPLACE INTO ingestion_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                run.run_id, run.filename, run.source_type, run.total_events,
                run.processed_events, run.dropped_events, run.duration_seconds,
                run.status, run.created_at
            ))

    def get_ingestion_runs(self) -> List[Dict[str, Any]]:
        cur = self.sqlite_conn.cursor()
        cur.execute("SELECT * FROM ingestion_runs ORDER BY created_at DESC")
        return [dict(r) for r in cur.fetchall()]

    def get_system_telemetry(self) -> SystemTelemetry:
        cur = self.sqlite_conn.cursor()
        cur.execute("SELECT COUNT(*) FROM detections")
        detection_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM incidents WHERE status = 'active'")
        active_incidents = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM incidents WHERE severity = 'critical' AND status = 'active'")
        critical_incidents = cur.fetchone()[0]

        duck_hosts = self.duck_conn.execute("SELECT COUNT(DISTINCT host) FROM events WHERE host IS NOT NULL").fetchone()[0]
        duck_users = self.duck_conn.execute("SELECT COUNT(DISTINCT user) FROM events WHERE user IS NOT NULL").fetchone()[0]

        cpu_p = psutil.cpu_percent(interval=None)
        mem_p = psutil.virtual_memory().percent

        return SystemTelemetry(
            events_received=self.total_received,
            events_processed=self.total_processed,
            events_per_second=self.current_eps,
            suspicious_detections=detection_count,
            active_incidents=active_incidents,
            critical_incidents=critical_incidents,
            hosts_involved=duck_hosts,
            users_involved=duck_users,
            current_status="operational",
            queue_backlog=max(0, self.total_received - self.total_processed),
            dropped_events=self.total_dropped,
            cpu_percent=cpu_p,
            memory_percent=mem_p,
            detection_latency_ms=self.last_detection_latency,
            correlation_latency_ms=self.last_correlation_latency
        )

    def reset_all(self):
        with self.sqlite_conn:
            self.sqlite_conn.execute("DELETE FROM incidents")
            self.sqlite_conn.execute("DELETE FROM detections")
            self.sqlite_conn.execute("DELETE FROM relationships")
            self.sqlite_conn.execute("DELETE FROM ingestion_runs")
        self.duck_conn.execute("DELETE FROM events")
        self.total_received = 0
        self.total_processed = 0
        self.total_dropped = 0
        self.current_eps = 0.0

db = StorageManager()
