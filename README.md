# Tracx

### Kill Chain Intelligence for evidence-backed attack reconstruction

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![DuckDB](https://img.shields.io/badge/DuckDB-Analytics-FFF000?logo=duckdb&logoColor=111827)](https://duckdb.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

Tracx is a security operations platform for turning fragmented telemetry into a coherent, explainable attack story. It combines streaming ingestion, Sigma-style detection, MITRE ATT&CK mapping, temporal correlation, graph reconstruction, and forward reachability analysis in one analyst-focused workspace.

It answers three operational questions:

1. **Where did the attack begin?**
2. **What did the attacker do, and how did they move?**
3. **What could the attacker reach next?**

## Live product preview

The screenshot below was captured from the running frontend with the FastAPI backend and simulation engine connected:

![Tracx Command Center running](Docs/tracx-command-center.png)

## Why Tracx

- **Evidence first:** every detection and graph edge can be traced back to normalized telemetry.
- **Confirmed vs. possible:** observed compromise is kept separate from hypothetical forward reachability.
- **Analyst workflow:** command center, live stream, attack graph, incident investigation, reports, and validation are available from one UI.
- **Explainable risk:** incidents are prioritized with a transparent multi-factor score rather than a black-box verdict.
- **Built for scale:** chunked ingestion and DuckDB/Parquet storage support the project's 15 GB, 30 GB, and 50 GB evaluation tiers.

## Architecture

```mermaid
flowchart LR
    Logs[Raw telemetry] --> Ingest[Streaming parser\n+ normalizer]
    Ingest --> Store[(DuckDB + Parquet)]
    Ingest --> Detect[Sigma detection engine]
    Detect --> Map[MITRE ATT&CK + Kill Chain]
    Map --> Correlate[Entity resolution\n+ temporal correlation]
    Correlate --> Graph[Attack graph + evidence]
    Correlate --> Exposure[Forward reachability]
    Store --> API[FastAPI]
    Graph --> API
    Exposure --> API
    API --> UI[React + TypeScript\n+ Vite analyst console]
```

### Core components

| Area | Capability |
| --- | --- |
| Ingestion | CSV, JSON, JSONL, Sysmon/EVTX, and Linux syslog normalization |
| Detection | Hot-reloadable Sigma-style YAML rules with ATT&CK technique mapping |
| Correlation | Multi-entity temporal clustering across hosts, users, IPs, and processes |
| Intelligence | NetworkX provenance graph, evidence explorer, and chronological replay |
| Exposure | Shortest-path reachability analysis for critical assets and blast radius |
| Validation | Positive, negative, and noisy rule tests plus telemetry coverage audits |
| Reporting | Explainable 0-100 risk scoring and structured incident reports |

## Technology stack

### Frontend

- React 19 and TypeScript
- Vite
- Cytoscape.js for attack-path visualization
- Lucide React icons
- Elastic-inspired dark security operations interface

### Backend

- Python 3.10+
- FastAPI and Uvicorn
- DuckDB and Parquet for analytical telemetry
- SQLite for incidents and provenance indexes
- NetworkX for graph analysis
- PyYAML for Sigma-style rule loading

### Operations

- Docker and Docker Compose
- Pytest backend test suite
- Oxlint and TypeScript build checks

## Quick start

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- Docker Desktop (optional)

### Run locally

From the repository root, install backend dependencies and start the API:

```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Run with Docker Compose

```bash
docker compose up --build
```

The containerized frontend is available at [http://localhost:3000](http://localhost:3000), with the API at [http://localhost:8000](http://localhost:8000).

## Validate the project

```bash
# Frontend type-check and production build
cd frontend
npm run build

# Frontend lint
npm run lint

# Backend tests
cd ..
pytest backend/tests
```

## Benchmark highlights

The included evaluation scenarios report the following measured results:

| Metric | Result |
| --- | ---: |
| Detection recall | 100% (5/5 attack steps) |
| ATT&CK labeling accuracy | 100% |
| Attack path reconstruction | 100% |
| False-positive alarm rate | 0% |
| Investigation response time | 38 ms |
| Peak memory footprint | 1.8 GB |

## Documentation

- [Architecture](Docs/ARCHITECTURE.md)
- [API reference](Docs/API.md)
- [Demo guide](Docs/DEMO_GUIDE.md)
- [Benchmarks](Docs/BENCHMARKS.md)
- [Build status](Docs/BUILD_STATUS.md)
- [Requirements traceability](Docs/REQUIREMENTS_TRACEABILITY.md)
- [CyberForge 2026 brief](Docs/CYBERFORGE_2026_HACKATHON_BRIEF.md)

## Project status

Tracx is an active CyberForge 2026 hackathon project. The repository includes reproducible demo scenarios, ground-truth labels, detection rules, evaluation utilities, and a complete analyst UI.

## License

No license has been specified yet. All rights remain with the project authors unless a license is added to this repository.
