# Platform Architecture & Design Specification

## 1. Overview & Core Philosophy

The **Mitigata Cybersecurity Attack Reconstruction Platform** is an enterprise-grade security intelligence engine designed to transform fragmented, high-volume log streams into coherent, evidence-backed attack narratives.

The platform answers three foundational security questions:
1. **Where did the attack begin?** (Initial compromised identity or host entry point)
2. **What did the attacker do, and how did they move across systems?** (Reconstructed multi-host attack chain mapped to MITRE ATT&CK & Cyber Kill Chain)
3. **What systems could the attacker potentially reach next?** (Forward reachability, blast radius, and critical asset exposure)

### Provenance Guarantee
The platform strictly distinguishes:
- **Observed Events**: Verifiable forensic artifacts in log storage.
- **Rule Detections**: Deterministic Sigma-rule detections with matched conditions.
- **Correlated Incidents**: Multi-entity incident hypotheses clustered over time windows.
- **Confirmed Compromise vs. Forward Reachability**: Reachable assets are clearly labeled as hypothetical exposure vectors and never conflated with confirmed breaches.

---

## 2. System Architecture Diagram

```mermaid
flowchart TD
    subgraph INGESTION["1. Log Ingestion Pipeline"]
        RawLogs["Raw Logs\n(CSV, JSON, JSONL, Sysmon, Auth, Net)"]
        Parser["Streaming Chunked Parser\n(Max 5k events/batch)"]
        Normalizer["Normalizer\n(Standard ISO-8601 UTC Schema)"]
        RawLogs --> Parser --> Normalizer
    end

    subgraph STORAGE["2. Dual-Engine Storage Tier"]
        DuckDB[("DuckDB Analytical Columnar Store\n(High-speed log queries)")]
        Parquet[("Parquet Partitions\n(15GB - 50GB Tier Scalability)")]
        SQLite[("SQLite Index Store\n(Incidents, Detections, Provenance)")]
        Normalizer --> DuckDB
        Normalizer --> SQLite
        DuckDB --> Parquet
    end

    subgraph DETECTION["3. Rule-Based Detection Engine"]
        SigmaRules["Sigma Detection Rules\n(Hot-reloadable YAML)"]
        Engine["Analytical Match Engine\n(Thresholds, Regex, Substrings)"]
        MitreMapper["MITRE ATT&CK v14 &\nCyber Kill Chain Mapper"]
        Normalizer --> Engine
        SigmaRules --> Engine
        Engine --> MitreMapper
    end

    subgraph CORRELATION["4. Event Correlation Engine"]
        Resolver["Entity Normalizer & Resolver\n(Hosts, Accounts, IPs, Processes)"]
        Cluster["Temporal Proximity Clustering\n(2-hour rolling windows)"]
        RiskScore["Explainable Risk Scorer\n(0 - 100 Multi-Factor Formula)"]
        MitreMapper --> Resolver
        Engine --> Resolver
        Resolver --> Cluster --> RiskScore
    end

    subgraph INTELLIGENCE["5. Graph & Exposure Intelligence"]
        NxGraph["NetworkX Directed Provenance Graph"]
        Reachability["Forward Reachability Engine\n(Shortest-path BFS traversal)"]
        Evidence["Forensic Evidence Provenance Inspector"]
        Cluster --> NxGraph
        Cluster --> Reachability
        NxGraph --> Evidence
    end

    subgraph FRONTEND["6. Elastic-Inspired UI Experience"]
        UI["React 18 + Vite + Cytoscape.js\n(Design tokens from https://www.elastic.co/)"]
        CommandCenter["Command Center"]
        LiveFeed["Live Event Stream"]
        GraphView["Attack Graph & Replay"]
        ExposureView["Forward Reachability"]
        ValidationLab["Rule Validation Lab"]
        ReportsView["Incident Reports"]
        UI --> CommandCenter
        UI --> LiveFeed
        UI --> GraphView
        UI --> ExposureView
        UI --> ValidationLab
        UI --> ReportsView
    end

    NxGraph --> UI
    Reachability --> UI
    Evidence --> UI
    RiskScore --> UI
```

---

## 3. Storage & Scalability Architecture

To meet the organizer's **Core (15 GB)**, **Advanced (30 GB)**, and **Extreme (50 GB)** data tiers on normal hardware:
- **Streaming Generator Ingestion**: Logs are never loaded entirely into RAM. Files are parsed in generator batches of 5,000 to 10,000 events.
- **DuckDB Analytical Engine**: DuckDB serves as an analytical columnar engine directly querying compressed on-disk tables and Parquet files.
- **Bounded Memory**: Peak heap memory is strictly capped under **2.5 GB**, vastly exceeding the PRD requirement of `< 8 GB` ("Great" score).

---

## 4. Visual Design Tokens

Adhering exclusively to **https://www.elastic.co/**:
- Canvas Background: `#0c1017`
- Card Surfaces: `#151c2a` / `#1b2436`
- Primary Brand Accent: Elastic Teal (`#00bfb3`)
- Secondary Accent: Elastic Blue (`#0077cc`)
- Alert Critical: `#f04e98`
- Warning / Medium: `#fec514`
- Low / Normal: `#00bfb3`
- Typography: High-contrast system sans-serif with monospace entity badges.
