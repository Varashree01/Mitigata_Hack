from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.storage import db

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_api_system_telemetry():
    res = client.get("/api/system/telemetry")
    assert res.status_code == 200
    data = res.json()
    assert "events_received" in data
    assert "events_per_second" in data
    assert "cpu_percent" in data
    assert "memory_percent" in data

def test_api_validation_lab():
    res = client.get("/api/validation/rules")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 5

    res_run = client.post("/api/validation/run")
    assert res_run.status_code == 200
    val_results = res_run.json()
    assert len(val_results) >= 5

def test_api_telemetry_coverage():
    res = client.get("/api/telemetry/coverage")
    assert res.status_code == 200
    data = res.json()
    assert "overall_coverage_percent" in data
    assert "matrix" in data

def test_api_simulation_lifecycle():
    # Start simulation
    res_start = client.post("/api/simulation/start?scenario=scenario_1&rate=10")
    assert res_start.status_code == 200

    # Check status
    res_status = client.get("/api/simulation/status")
    assert res_status.status_code == 200
    assert res_status.json()["status"] in ["running", "started"]

    # Pause
    res_pause = client.post("/api/simulation/pause")
    assert res_pause.status_code == 200

    # Resume
    res_resume = client.post("/api/simulation/resume")
    assert res_resume.status_code == 200

    # Stop
    res_stop = client.post("/api/simulation/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["status"] == "stopped"

def test_api_evaluation_benchmark():
    res = client.post("/api/evaluation/benchmark?tier=Core+(15+GB)")
    assert res.status_code == 200
    data = res.json()
    assert "measured_throughput_eps" in data
    assert "bounded_memory_guarantee" in data

def test_api_incident_endpoints():
    # Trigger scenario 1 to populate DB
    from datetime import datetime, timezone
    from backend.app.simulation.scenarios import get_scenario_1_events
    from backend.app.detection.engine import detection_engine
    from backend.app.correlation.incident_builder import correlation_engine

    now = datetime.now(timezone.utc)
    evs, _ = get_scenario_1_events(now)
    db.insert_events_batch(evs)
    dets = detection_engine.evaluate_events(evs)
    incs = correlation_engine.correlate_batch(evs, dets)

    inc_id = incs[0].incident_id

    # Test GET incidents
    res_incs = client.get("/api/incidents")
    assert res_incs.status_code == 200
    assert len(res_incs.json()) >= 1

    # Test GET incident details
    res_inc = client.get(f"/api/incidents/{inc_id}")
    assert res_inc.status_code == 200
    assert res_inc.json()["incident_id"] == inc_id

    # Test GET timeline
    res_tl = client.get(f"/api/incidents/{inc_id}/timeline")
    assert res_tl.status_code == 200
    assert len(res_tl.json()) > 0

    # Test GET graph
    res_graph = client.get(f"/api/incidents/{inc_id}/graph")
    assert res_graph.status_code == 200
    assert "nodes" in res_graph.json()
    assert "edges" in res_graph.json()

    # Test GET evidence
    res_ev = client.get(f"/api/incidents/{inc_id}/evidence")
    assert res_ev.status_code == 200
    assert "events" in res_ev.json()

    # Test GET exposure
    res_exp = client.get(f"/api/exposure/{inc_id}")
    assert res_exp.status_code == 200
    assert "potential_next_targets" in res_exp.json()

    # Test GET report
    res_rep = client.get(f"/api/reports/{inc_id}")
    assert res_rep.status_code == 200
    assert "executive_summary" in res_rep.json()
