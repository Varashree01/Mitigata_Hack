import shutil
import json
import asyncio
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from backend.app.schemas import (
    SystemTelemetry, AttackGraphPayload, ForwardReachabilityResult,
    RuleValidationResult
)
from backend.app.storage import db
from backend.app.config import STORAGE_DIR
from backend.app.ingestion.streaming import process_file_stream
from backend.app.intelligence.attack_graph import attack_graph_builder
from backend.app.intelligence.evidence import get_evidence_details, get_incident_evidence_bundle
from backend.app.exposure.reachability import reachability_engine
from backend.app.simulation.generator import live_simulator
from backend.app.validation.rule_tests import run_rule_validation_suite
from backend.app.validation.coverage import assess_telemetry_coverage
from backend.app.evaluation.evaluator import evaluator
from backend.app.reports.generator import generate_incident_report
from backend.app.detection.sigma_loader import load_all_rules

router = APIRouter(prefix="/api")

# --- System & Health ---
@router.get("/health")
def get_health():
    return {"status": "ok", "service": "Tracx Attack Reconstruction Intelligence Platform", "version": "1.0.0"}

@router.get("/system/telemetry", response_model=SystemTelemetry)
def get_telemetry():
    return db.get_system_telemetry()

# --- Ingestion ---
@router.post("/ingestion/upload")
async def upload_log_file(file: UploadFile = File(...), source_hint: str = Form("auto")):
    dest_path = STORAGE_DIR / file.filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process stream chunked
    run = process_file_stream(dest_path, source_hint=source_hint)
    return {"status": "processed", "run": run.model_dump()}

@router.get("/ingestion/runs")
def get_ingestion_runs():
    return db.get_ingestion_runs()

# --- Events ---
@router.get("/events")
def get_events(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    host: Optional[str] = None,
    user: Optional[str] = None
):
    return db.get_events(limit=limit, offset=offset, host=host, user=user)

@router.get("/events/{event_id}")
def get_event(event_id: str):
    ev = db.get_event_by_id(event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev

# --- Detections ---
@router.get("/detections")
def get_detections(incident_id: Optional[str] = None, limit: int = 100):
    return db.get_detections(incident_id=incident_id, limit=limit)

@router.get("/detections/{detection_id}")
def get_detection(detection_id: str):
    cur = db.sqlite_conn.cursor()
    cur.execute("SELECT * FROM detections WHERE detection_id = ?", (detection_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Detection not found")
    d = dict(row)
    d["event_references"] = json.loads(d["event_references"]) if d["event_references"] else []
    return d

# --- Incidents ---
@router.get("/incidents")
def get_incidents():
    return db.get_incidents()

@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.get("/incidents/{incident_id}/timeline")
def get_incident_timeline(incident_id: str):
    return attack_graph_builder.build_incident_timeline(incident_id)

@router.get("/incidents/{incident_id}/graph", response_model=AttackGraphPayload)
def get_incident_graph(incident_id: str, include_exposure: bool = True):
    return attack_graph_builder.build_incident_graph(incident_id, include_exposure=include_exposure)

@router.get("/incidents/{incident_id}/evidence")
def get_incident_evidence(incident_id: str):
    bundle = get_incident_evidence_bundle(incident_id)
    if "error" in bundle:
        raise HTTPException(status_code=404, detail=bundle["error"])
    return bundle

# --- Exposure & Reachability ---
@router.get("/exposure/{incident_id}", response_model=ForwardReachabilityResult)
def get_exposure(incident_id: str):
    return reachability_engine.analyze_reachability(incident_id)

# --- Live Simulation Controls ---
@router.post("/simulation/start")
def start_simulation(scenario: str = Query("scenario_1"), rate: float = Query(4.0)):
    return live_simulator.start(scenario_id=scenario, event_rate=rate)

@router.post("/simulation/pause")
def pause_simulation():
    return live_simulator.pause()

@router.post("/simulation/resume")
def resume_simulation():
    return live_simulator.resume()

@router.post("/simulation/stop")
def stop_simulation():
    return live_simulator.stop()

@router.post("/simulation/reset")
def reset_simulation():
    return live_simulator.reset()

@router.get("/simulation/status")
def get_simulation_status():
    return {
        "status": live_simulator.status,
        "scenario": live_simulator.scenario_id,
        "rate": live_simulator.event_rate,
        "events_emitted": live_simulator.events_emitted
    }

# --- WebSocket for real-time live events ---
@router.websocket("/simulation/ws")
async def websocket_simulation(websocket: WebSocket):
    await websocket.accept()
    loop = asyncio.get_event_loop()
    queue = asyncio.Queue()

    def live_cb(data: dict):
        loop.call_soon_threadsafe(queue.put_nowait, data)

    live_simulator.subscribe(live_cb)
    try:
        while True:
            item = await queue.get()
            await websocket.send_json(item)
    except WebSocketDisconnect:
        live_simulator.unsubscribe(live_cb)
    except Exception:
        live_simulator.unsubscribe(live_cb)

# --- Validation Lab ---
@router.get("/validation/rules")
def get_rules():
    return load_all_rules()

@router.post("/validation/run", response_model=List[RuleValidationResult])
def run_validation():
    return run_rule_validation_suite()

# --- Telemetry Coverage ---
@router.get("/telemetry/coverage")
def get_coverage():
    return assess_telemetry_coverage()

# --- Evaluation & Benchmarks ---
@router.get("/evaluation/metrics")
def get_evaluation_metrics(scenario: str = Query("scenario_1")):
    return evaluator.evaluate_scenario(scenario_name=scenario)

@router.post("/evaluation/benchmark")
def run_benchmark(tier: str = Query("Core (15 GB)")):
    return evaluator.benchmark_dataset_tier(tier_name=tier)

# --- Incident Reports ---
@router.get("/reports/{incident_id}")
def get_report(incident_id: str):
    rep = generate_incident_report(incident_id)
    if "error" in rep:
        raise HTTPException(status_code=404, detail=rep["error"])
    return rep
