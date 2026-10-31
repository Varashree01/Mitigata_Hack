# Kill Chain Attack Path Reconstruction — Past Winners

As of 2026-10-31 · Source: [AI Cybersecurity Past Hackathon Winners.docx](AI%20Cybersecurity%20Past%20Hackathon%20Winners.docx)

> These projects are inspiration only. The organizers' requirements in [KILL_CHAIN_PROBLEM_STATEMENT.md](KILL_CHAIN_PROBLEM_STATEMENT.md) decide what we build.

## Overview

Our winners doc tags six winning projects to the Kill Chain Attack Path Reconstruction track. Three list it as their primary track: threatFlix, ProofSIFT and EchoLocate. Three list it as a secondary fit beside another track: NARA, NOVA and Kavach.

All six come from Devpost hackathons held 2024–2026. None of the DARPA AIxCC or Indian national winners in that doc are tagged to this track. Links below are the ones the source doc gives.

## Past winners

The three primary-track winners come first, then the three secondary fits.

| Project | Hackathon | Award | Team | What it built | Track fit |
| --- | --- | --- | --- | --- | --- |
| [threatFlix](https://devpost.com/software/threatflix) | [SS Hacker Team Cybersecurity Global Challenge 2026](https://sshackerteamglobal.devpost.com/) | 1st Place | Atharva Jaiswal, Parth Jaiswal | Security copilot: npm telemetry SDK, pip UEBA ML model, deterministic detection, attack-graph correlation, MITRE ATT&CK mapping, Gemini remediation | Primary, plus telemetry aggregation |
| [ProofSIFT](https://sshackerteamglobal.devpost.com/project-gallery) | [SS Hacker Team Cybersecurity Global Challenge 2026](https://sshackerteamglobal.devpost.com/) | Winner | ProofSIFT Team | Autonomous DFIR triage engine; checks every claim against traceable forensic artifacts, self-corrects weak hypotheses, logs audit-ready SQLite provenance | Primary |
| [EchoLocate](https://devpost.com/software/echolocate-e4k3dg) | Bitcamp 2026 | Best Moonshot Hack | Sujay Chava, Abhinav Karumudi, Akshaj Nadimpalli, Pranay Kakkar | Gamified forensics command center; up to 8 parallel Featherless/Qwen agents (LOGIS, NEXUS, FILER, CHRONO) turn raw logs into JSON and a live attack-path evidence graph; ElevenLabs voice input | Primary, plus network mapping |
| [NARA – Autonomous Red Teaming Agent](https://devpost.com/software/nara-autonomous-red-teaming-agent) | Bitcamp 2026 | Best Champion of Open Source (Featherless) and Agentic Revolution Award | Israel Ogwu, Ricky Chen, Ayush Mishra, Aprameya Kannan | Four agents (Scanner, Planner, Exploiter, Blue Team Advisor): Semgrep/Bandit scan, MITRE ATT&CK kill-chain planning, live exploit proof in a sandboxed Docker/noVNC desktop, streamed fixes | Secondary, with SAST/DAST correlation |
| [NOVA: The Prompt Pattern Matching](https://devpost.com/software/test-xfts7e) | [SANS AI Cybersecurity Hackathon](https://ai-cybersecurity-hackathon.devpost.com/) | Winner | Thomas Roccia | YARA-style prompt-hunting framework in Python: regex, semantic NLP and LLM evaluation to detect prompt injection, exfiltration and GenAI TTPs | Secondary, with config-driven integration |
| [Kavach (Telemetry Dashboard)](https://kyxgo-hack-by-aditya-rai-yash.devpost.com/project-gallery) | Kyxgo Hack | Winner | Lakshay Yadav | Real-time infrastructure telemetry aggregation and behavioral threat-correlation dashboard | Secondary, with multi-tenant data aggregation |

ProofSIFT and Kavach have no project page in our doc, so they link to the event gallery. Not a winner but closest in scope: ThreatWeaver (Shivam Shukla), a portfolio prototype that turns 847 SIEM alerts into an APT kill chain in under 90 seconds.

## Patterns

The winners turn raw logs into a visible, evidence-backed attack path, not a list of alerts.

- **Raw telemetry in:** threatFlix ships its own ingestion SDK; EchoLocate and Kavach start from raw logs and live infrastructure data.
- **A graph out:** threatFlix (attack-graph correlation), EchoLocate (attack-path evidence graph) and ThreatWeaver (alerts to one APT chain) all show the path as a graph.
- **MITRE ATT&CK as the spine:** threatFlix and NARA map each step to ATT&CK techniques.
- **Proof over guesses:** ProofSIFT ties every claim to a forensic artifact with SQLite provenance; threatFlix runs deterministic detection before the LLM; NARA proves exploits live in a sandbox.
- **Agents split the work:** EchoLocate runs up to 8 parallel agents and NARA runs four with fixed roles.
