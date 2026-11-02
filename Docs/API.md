# REST & Streaming API Documentation

All API endpoints are hosted at `http://localhost:8000/api`.

---

## 1. System Health & Telemetry

### `GET /api/health`
Returns service operational health.
```json
{
  "status": "ok",
  "service": "Mitigata Attack Reconstruction Intelligence Platform",
  "version": "1.0.0"
}
```

### `GET /api/system/telemetry`
Returns real-time pipeline performance and host system statistics.
```json
{
  "events_received": 1420,
  "events_processed": 1420,
  "events_per_second": 12.5,
  "suspicious_detections": 8,
  "active_incidents": 1,
  "critical_incidents": 1,
  "hosts_involved": 2,
  "users_involved": 1,
  "current_status": "operational",
  "queue_backlog": 0,
  "dropped_events": 0,
  "cpu_percent": 8.4,
  "memory_percent": 42.1,
  "detection_latency_ms": 11.2,
  "correlation_latency_ms": 14.8
}
```

---

## 2. Ingestion & Events

### `POST /api/ingestion/upload`
Uploads raw security log files for chunked streaming ingestion.
- Form field: `file` (Multipart file: `.csv`, `.json`, `.jsonl`, `.log`)
- Form field: `source_hint` (`auto`, `windows_sysmon`, `linux_auth`, `zeek`, `suricata`, `csv_feed`)

### `GET /api/ingestion/runs`
Lists all historical file ingestion batches and run durations.

### `GET /api/events`
Returns paginated normalized events from DuckDB.
- Parameters: `limit` (default 50), `offset`, `host`, `user`.

### `GET /api/events/{event_id}`
Retrieves complete raw event and normalized attributes for a specific event ID.

---

## 3. Detections & Incidents

### `GET /api/detections`
Lists rule detections, optionally filtered by `incident_id`.

### `GET /api/incidents`
Lists all reconstructed multi-host incidents sorted by Explainable Risk Score.

### `GET /api/incidents/{incident_id}`
Returns details for an incident, including affected hosts, users, tactics, and risk score.

### `GET /api/incidents/{incident_id}/timeline`
Returns the chronological attack sequence timeline for investigation replay.

### `GET /api/incidents/{incident_id}/graph`
Returns the Cytoscape.js directed attack graph representation:
```json
{
  "incident_id": "INC-01",
  "nodes": [
    { "data": { "id": "host_HR-07", "label": "HR-07", "entity_type": "host", "is_compromised": true, "is_hypothetical": false } },
    { "data": { "id": "asset_DC-01", "label": "DC-01", "entity_type": "asset", "is_compromised": false, "is_hypothetical": true } }
  ],
  "edges": [
    { "data": { "id": "edge_0", "source": "host_HR-07", "target": "host_FS-02", "label": "Lateral Smb", "is_potential_path": false } },
    { "data": { "id": "edge_1", "source": "host_FS-02", "target": "asset_DC-01", "label": "Potential: Domain Escalation", "is_potential_path": true } }
  ],
  "summary": { "total_nodes": 6, "total_edges": 5, "risk_score": 92.0 }
}
```

### `GET /api/incidents/{incident_id}/evidence`
Forensic evidence explorer bundle preserving exact raw log artifacts for every graph edge and alert.

---

## 4. Forward Reachability & Exposure

### `GET /api/exposure/{incident_id}`
Calculates lateral blast radius and unreached critical assets:
- `potential_next_targets`: Assets, criticality, traversed hops, reachability type, assumptions, missing evidence, exposure score.
- `recommended_mitigations`: Actionable isolation and containment procedures.

---

## 5. Live Simulation & Streaming

### `POST /api/simulation/start?scenario={scenario_id}&rate={eps}`
Starts live event generator.
- `scenario`: `scenario_1` (Retail Vendor Breach), `scenario_2` (Phishing C2), `scenario_3` (AD Kerberoast)
- `rate`: Events per second (1.0 - 50.0)

### `POST /api/simulation/pause`
Pauses event emission.

### `POST /api/simulation/resume`
Resumes event emission.

### `POST /api/simulation/stop`
Stops simulation.

### `POST /api/simulation/reset`
Resets simulation counters and clears database.

### `WS /api/simulation/ws`
WebSocket endpoint streaming live generated events, triggered detections, and updated incidents directly to frontend subscribers.

---

## 6. Validation, Coverage & Reports

### `GET /api/validation/rules`
Lists all loaded Sigma-style detection rules.

### `POST /api/validation/run`
Executes test suite across all rules with positive targets, negative controls, and noisy inputs. Returns Precision, Recall, and False Positive Rates.

### `GET /api/telemetry/coverage`
Audits log visibility matrix against MITRE ATT&CK techniques.

### `GET /api/reports/{incident_id}`
Returns complete structured incident report in plain English with executive summary, timeline, and remediation plan.

### `GET /api/evaluation/metrics?scenario={scenario_id}`
Runs independent ground-truth evaluation and reports detection recall, ATT&CK labeling accuracy, attack path reconstruction rate, and false alarm rate.

### `POST /api/evaluation/benchmark?tier={tier}`
Executes benchmark against PRD dataset tiers (`Core (15 GB)`, `Advanced (30 GB)`, `Extreme (50 GB)`).
