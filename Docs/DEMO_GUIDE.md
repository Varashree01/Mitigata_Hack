# End-to-End Evaluation & Demonstration Guide

This guide provides step-by-step instructions for hackathon judges and evaluators to test all capabilities of the platform.

---

## 1. Quick Launch

### Option A: Local Run (Fastest)

1. **Start Backend**:
   ```bash
   # In project root
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
   ```
   Backend API docs will be live at `http://localhost:8000/docs`.

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

### Option B: Docker Compose
```bash
docker-compose up --build
```
Open `http://localhost:3000` in your browser.

---

## 2. Interactive Demonstration Walkthrough

### Step 1: Command Center Overview
1. Open `http://localhost:5173` (defaults to **Command Center**).
2. Note the real-time operational status, events processed counter, EPS, CPU/Memory telemetry, and active incident list.
3. If fresh start, the incident list will show a clean empty state.

### Step 2: Live Attack Simulation
1. Click **Live Stream** in the top navigation.
2. Select **Scenario 1 (INC-01 Retail Vendor Breach)** from the scenario cards.
3. Set the stream rate slider to **5 EPS** or **10 EPS**.
4. Click **Start Simulation**.
5. Watch the live terminal stream incoming events:
   - Notice normal background traffic labeled `[BACKGROUND]` in muted text.
   - Watch the password spray attack arrive labeled `[ATTACK STEP]`.
   - See the alert appear: `[THREAT DETECTED] Authentication Brute Force Guessing (T1110.001)`.
   - Watch subsequent attacker steps: `whoami /all` (T1082), LSASS memory dumping via `procdump` (T1003), lateral movement over SMB to `FS-02` (T1021.002), and archive data exfiltration to `mega.nz` (T1567).
6. Note the top right badge updating: `1 Active Incident`.

### Step 3: Attack Graph & Replay Reconstruction
1. Click **Attack Graph** in the top navigation (or click "Investigate" from Command Center).
2. Inspect the reconstructed **Cytoscape.js** directed attack graph:
   - Notice the external adversary IP `185.220.101.5` linked to `HR-07`.
   - Compromised vendor account `v_jallen` authenticated to `HR-07`.
   - Directed lateral SMB arrow from `HR-07` to `FS-02`.
   - Potential reachability targets (`DC-01`, `DB-PROD-01`, `PAY-VAULT-01`) rendered in **dashed golden styling** representing forward exposure paths, clearly separated from confirmed breaches!
3. **Investigation Replay**:
   - In the graph canvas footer, click **Play Timeline** or click **Step Forward** / **Step Backward** to replay the attack chronologically.
   - Watch the timeline sequence update step by step.

### Step 4: Forensic Evidence Inspection
1. In the Attack Sequence Timeline on the right, click **Step 3 (LSASS Memory Credential Dumping)** or click directly on any graph edge.
2. The **Forensic Evidence Explorer** opens:
   - Verify the exact raw forensic log artifact: `procdump64.exe -ma lsass.exe lsass_dump.dmp`.
   - Inspect event ID, original timestamp, host, user, and verification status.

### Step 5: Forward Reachability & Blast Radius Analysis
1. Click **Forward Reachability** in the top navigation.
2. View the lateral blast radius summary:
   - Reachability table displays critical assets at risk: `Primary Domain Controller DC-01` (1 hop away), `Production Database DB-PROD-01` (2 hops away), `Payment Vault PAY-VAULT-01`.
   - Read the clear **Assumptions** and **Missing Evidence** columns (e.g. "Multi-factor authentication token required; no token theft observed").
   - Review actionable proactive containment recommendations.

### Step 6: Detection Validation Lab
1. Click **Validation Lab** in the navigation bar.
2. Click **Run All Rule Tests**.
3. View the empirical test results across all 7 Sigma detection rules:
   - Precision: 100%
   - Recall: 100%
   - False Positive Rate: 0%
   - Unit test pass rate and robustness observations against missing fields and benign negative samples.

### Step 7: Telemetry Coverage Audit
1. Click **Coverage Audit** in the navigation bar.
2. View the MITRE ATT&CK technique matrix:
   - Clearly inspects which techniques have active log coverage and rules.
   - Highlights visibility blind spots (e.g. ransomware canary sensors).

### Step 8: Auto-Generated Incident Report
1. Click **Incident Reports** in the navigation bar.
2. View the plain-English executive summary, initial observed activity, chronological timeline, and multi-factor explainable Risk Score (92.0 / 100).
3. Click **Copy Report MD** to copy the formatted report to your clipboard.

### Step 9: Independent Evaluation & Scale Benchmarks
1. Click **Benchmarks & Evaluation** in the top navigation.
2. Inspect the **Organizer Evaluation Metrics vs Ground Truth**:
   - Detection Recall: **100.0%** (Exceeds organizer Great target > 90%)
   - ATT&CK Technique Labeling Accuracy: **100.0%** (Exceeds Great target > 85%)
   - Attack Path Reconstruction: **100.0%** (Exceeds Great target 100%)
   - False Positive Alarms: **0.0%** (Exceeds Great target < 10%)
   - Status: **PASSED_GREAT**
3. Select **Core (15 GB)**, **Advanced (30 GB)**, or **Extreme (50 GB)** tier and click **Run Scale Benchmark**.
   - Note the measured throughput in EPS and the memory bound proof ensuring RAM stays `< 2.5 GB`.
