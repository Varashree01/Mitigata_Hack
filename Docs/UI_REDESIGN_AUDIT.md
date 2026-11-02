# UI/UX Redesign Audit & Migration Plan

This audit outlines the transformation of the MITIGATA Attack Reconstruction Platform from the prototype dark theme into a professional, full-screen, enterprise light-theme workspace inspired by Elastic, Linear, and Datadog.

---

## 1. Existing System Audit

| Screen / Component | Current Implementation Issues | Proposed Enterprise Redesign |
| :--- | :--- | :--- |
| **Global Layout** | Fixed max-width centered container (`maxWidth: 1600px`), large empty margins, horizontal top navbar. | Full-screen viewport (`100dvh`), persistent collapsible left sidebar (250px / 64px), compact top breadcrumb & status header. |
| **Color System** | Pure dark theme (`#0c1017`, `#151c2a`). Dark background restricts readability for dense tabular data. | Enterprise light theme (`--app-background: #F5F7FA`, `--surface: #FFFFFF`, crisp borders `#E3E8EF`, restrained teal `#00A9A0`). |
| **Typography** | Inconsistent weights, oversized card numbers, lack of compact metadata hierarchy. | Clean typographic scale (11px metadata, 13px table cells, 14px body, 18-20px titles) with monospaced entity badges. |
| **Command Center** | Basic card grid with basic metrics and unstyled incident table. | High-density operational dashboard: compact KPI row, event throughput trend, incident severity breakdown, quick-filter incident list. |
| **Live Event Stream** | Narrow centered layout with terminal dump below controls. | 2-column operational workspace: live searchable event stream table on the left, scenario control & stream statistics panel on the right. |
| **Data Ingestion** | Generic form inputs and static history table. | Professional data pipeline interface: Drag-and-drop dropzone, parser selector, live ingestion progress, and detailed execution run history. |
| **Attack Graph** | Embedded 700px box; dark-styled canvas with hardcoded node coordinates. | Full-workspace canvas utilizing Cytoscape.js with light-theme nodes, directed bezier curves, legend, zoom/fit toolbar, timeline drawer, and evidence inspector. |
| **Forward Reachability** | Basic warning banner and plain table. | Exposure analysis console: blast radius metrics, shortest lateral distance cards, structured path traversal table with assumptions and mitigations. |
| **Validation Lab** | Wide cluttered table with long text strings in cells. | QA testing suite: pass rate summary cards, rule filter, rule detail inspection drawer, empirical precision/recall metrics. |
| **Telemetry Coverage** | Flat table without tactic filters. | ATT&CK matrix audit: tactic category filter, coverage status badges (Available, Partial, Missing), visibility blind-spot callouts. |
| **Incident Reports** | Centered text blocks with markdown output. | Formal forensic incident report: editorial left-aligned layout, executive summary, timeline sequence, next targets, containment checklist, copy actions. |
| **Benchmarks & Eval** | Basic benchmark card without tier comparison. | Tier performance analyzer: PRD "Good" vs "Great" target comparison cards, interactive tier simulator (15GB / 30GB / 50GB), memory boundedness proof. |
| **Settings** | Missing dedicated settings screen. | Added comprehensive Settings screen: backend API config, batch size, simulation rate, LLM provider, database maintenance. |

---

## 2. Preserved Backend Architecture
- **DuckDB Analytical Store**: Chunked event storage and high-throughput queries remain intact.
- **NetworkX Directed Provenance Graph**: Complete topology reconstruction with verifiable edge evidence preserved.
- **Sigma Detection Engine**: All 7 Sigma-style YAML threat rules remain operational.
- **MITRE ATT&CK & Cyber Kill Chain**: Automated mapping engine preserved.
- **FastAPI Endpoints**: All existing REST routes (`/api/*`) and WebSocket feed (`/api/simulation/ws`) preserved.
