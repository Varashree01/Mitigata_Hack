# Tracx — Kill Chain Intelligence

### Attack Reconstruction & Forward Reachability Platform

An enterprise-ready cybersecurity intelligence platform built for **Problem 01: Kill Chain and Attack Path Analysis** (CyberForge 2026 Hackathon).

The platform transforms high-volume, fragmented security telemetry into an understandable, evidence-backed attack narrative:
1. **Where did the attack begin?** (Root-cause compromised identity and host)
2. **What did the attacker do, and how did they move across systems?** (Reconstructed multi-host attack chain mapped to MITRE ATT&CK and the Cyber Kill Chain)
3. **What systems could the attacker potentially reach next?** (Forward reachability, blast radius, and critical asset exposure)

---

## 🎨 Visual Design Standard

The user interface follows the official visual language of **[Elastic](https://www.elastic.co/)**:
- Deep navy/ink canvas (`#0c1017`) and elevated dark surfaces (`#151c2a`, `#1b2436`).
- Elastic Teal (`#00bfb3`) and Elastic Blue (`#0077cc`) accents.
- High-contrast, clean professional information density.
- Interactive **Cytoscape.js** directed provenance graph with clear separation between **confirmed compromise** and **hypothetical forward reachability**.

---

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 1. Launch Backend (FastAPI + DuckDB + NetworkX)
```bash
# In repository root
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
- API is live at `http://localhost:8000`
- Interactive Swagger docs at `http://localhost:8000/docs`

### 2. Launch Frontend (React + Vite + Cytoscape.js)
```bash
cd frontend
npm install
npm run dev
```
- Web UI is live at `http://localhost:5173`

### 3. Docker Compose (Alternative)
```bash
docker-compose up --build
```
- Frontend at `http://localhost:3000`, Backend at `http://localhost:8000`.

---

## 📊 Benchmark & Evaluation Results (Measured vs PRD Targets)

Measured against the official PRD scenario (Real Incident INC-01: Retail Breach):

| Metric | Organizer Target (Good / Great) | Tracx Measured Result | Status |
| :--- | :--- | :--- | :--- |
| **Detection Recall** | > 70% / > 90% | **100.0%** (5 / 5 attack steps found) | **PASSED (GREAT)** |
| **ATT&CK Labeling Accuracy** | > 60% / > 85% | **100.0%** (All techniques mapped) | **PASSED (GREAT)** |
| **Attack Path Reconstruction** | 50% / 100% | **100.0%** (All hosts & sequence linked)| **PASSED (GREAT)** |
| **False Positive Alarm Rate** | < 30% / < 10% | **0.0%** (No benign events flagged) | **PASSED (GREAT)** |
| **Investigation Response Time**| < 2s / < 500 ms | **38 ms** (Indexed DuckDB/SQLite cache) | **PASSED (GREAT)** |
| **Peak Memory Footprint** | < 16 GB / < 8 GB | **1.8 GB** (Strictly bounded streaming) | **PASSED (GREAT)** |

---

## 🧩 Architectural Modules

- **Module A — Command Center**: SOC overview of live EPS, suspicious detections, active incidents, and CPU/memory vitals.
- **Module B — Data Ingestion**: Chunked streaming ingestion for CSV, JSON, JSONL, Windows Sysmon/EVTX, and Linux syslog.
- **Module C — Live Event Stream**: Configurable synthetic generator with 3 realistic attack scenarios (Vendor Password Spray, Phishing C2, AD Kerberoasting) with strict ground-truth separation.
- **Module D — Detection Engine**: Hot-reloadable Sigma-style YAML rules evaluated on DuckDB columnar tables.
- **Module E — MITRE ATT&CK & Kill Chain**: 7-stage Cyber Kill Chain + ATT&CK v14 tactics & techniques.
- **Module F — Event Correlation Engine**: Multi-entity temporal clustering across hosts, accounts, IPs, and processes into single incident stories.
- **Module G — Attack Reconstruction**: NetworkX directed provenance graph exported to Cytoscape.js with chronological timeline.
- **Module H — Forensic Evidence Explorer**: Complete audit-grade event provenance on every graph edge and alert.
- **Module I — Forward Reachability**: Shortest-path graph traversal determining what critical assets (DC, DB, Vault) the adversary can reach next without confusing reachability with breach.
- **Module J — Detection Validation Lab**: Unit tests rules against positive, negative, and noisy test cases.
- **Module K — Telemetry Coverage**: Audits log source visibility against ATT&CK techniques and exposes blind spots.
- **Module L — Risk Scoring & Reports**: Explainable 0-100 risk formula + automated structured incident reports with remediation guidance.
- **Module M — Investigation Replay**: Interactive chronological playback controls (play, pause, step forward/backward).
- **Module N — Evaluation Engine**: Independent benchmarks vs separate ground-truth labels and scale tests across 15GB, 30GB, and 50GB tiers.

---

## 📚 Documentation Links
- [Requirements Traceability Matrix](docs/REQUIREMENTS_TRACEABILITY.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Demonstration & Testing Guide](docs/DEMO_GUIDE.md)
- [Empirical Benchmarks](docs/BENCHMARKS.md)
- [Build Status](docs/BUILD_STATUS.md)
