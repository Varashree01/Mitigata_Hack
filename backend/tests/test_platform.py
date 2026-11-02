import pytest
import os
import json
from datetime import datetime, timezone
from backend.app.schemas import NormalizedEvent, SeverityLevel, KillChainStage
from backend.app.ingestion.normalizer import normalize_event
from backend.app.detection.engine import DetectionEngine
from backend.app.detection.mitre_mapper import resolve_mitre_mapping
from backend.app.correlation.entity_resolver import clean_hostname, clean_username, extract_relationships_from_event
from backend.app.correlation.incident_builder import CorrelationEngine
from backend.app.intelligence.attack_graph import attack_graph_builder
from backend.app.exposure.reachability import reachability_engine
from backend.app.validation.rule_tests import run_rule_validation_suite
from backend.app.validation.coverage import assess_telemetry_coverage
from backend.app.evaluation.evaluator import evaluator
from backend.app.simulation.scenarios import get_scenario_1_events
from backend.app.storage import db

@pytest.fixture(autouse=True)
def setup_teardown():
    db.reset_all()
    yield
    db.reset_all()

def test_normalization_and_schema():
    raw_log = {
        "event_id": "test-101",
        "timestamp": "2026-10-31 10:15:30",
        "Computer": "hr-07.corp.local",
        "TargetUserName": "CORP\\v_jallen",
        "EventID": "4625",
        "IpAddress": "185.220.101.5"
    }
    norm = normalize_event(raw_log, default_source="windows_sysmon")
    assert norm.event_id == "test-101"
    assert norm.host == "HR-07.CORP.LOCAL"
    assert norm.user == "v_jallen"
    assert norm.event_type == "authentication"
    assert norm.action == "logon_failed"
    assert norm.source_ip == "185.220.101.5"

def test_mitre_and_kill_chain_mapping():
    m1 = resolve_mitre_mapping("T1110.001")
    assert m1["name"] == "Password Guessing"
    assert m1["kill_chain_stage"] == KillChainStage.DELIVERY

    m2 = resolve_mitre_mapping("T1059.001")
    assert m2["tactic"] == "Execution"
    assert m2["kill_chain_stage"] == KillChainStage.EXPLOITATION

    m3 = resolve_mitre_mapping("T1567")
    assert m3["kill_chain_stage"] == KillChainStage.ACTIONS_ON_OBJECTIVES

def test_detection_engine_rules():
    engine = DetectionEngine()
    # 1. PowerShell rule
    ps_event = NormalizedEvent(
        event_id="det-ps-01",
        timestamp="2026-10-31T12:00:00Z",
        host="WS-01",
        user="test_admin",
        process_name="powershell.exe",
        command_line="powershell.exe -enc AAAA -ExecutionPolicy bypass",
        event_type="process_creation",
        action="process_created"
    )
    dets = engine.evaluate_events([ps_event])
    assert len(dets) >= 1
    assert any(d.rule_id == "SIGMA-002" for d in dets)
    assert any(d.technique_id == "T1059.001" for d in dets)

def test_correlation_and_multi_host_incident():
    corr = CorrelationEngine()
    now = datetime.now(timezone.utc)
    attack_events, gt = get_scenario_1_events(now)

    engine = DetectionEngine()
    db.insert_events_batch(attack_events)
    dets = engine.evaluate_events(attack_events)
    incidents = corr.correlate_batch(attack_events, dets)

    assert len(incidents) >= 1
    primary_inc = incidents[0]
    assert primary_inc.risk_score > 50.0
    assert "HR-07" in primary_inc.affected_hosts
    assert "FS-02" in primary_inc.affected_hosts
    assert len(primary_inc.kill_chain_stages) >= 3

def test_attack_graph_and_provenance():
    now = datetime.now(timezone.utc)
    attack_events, gt = get_scenario_1_events(now)
    engine = DetectionEngine()
    corr = CorrelationEngine()

    db.insert_events_batch(attack_events)
    dets = engine.evaluate_events(attack_events)
    incidents = corr.correlate_batch(attack_events, dets)
    inc_id = incidents[0].incident_id

    graph = attack_graph_builder.build_incident_graph(inc_id, include_exposure=True)
    assert len(graph.nodes) > 0
    assert len(graph.edges) > 0

    # Ensure compromised nodes vs hypothetical targets are clearly distinguished!
    compromised_nodes = [n for n in graph.nodes if n.data.is_compromised]
    hypo_targets = [n for n in graph.nodes if n.data.is_hypothetical]
    assert len(compromised_nodes) >= 2
    assert len(hypo_targets) >= 1

    timeline = attack_graph_builder.build_incident_timeline(inc_id)
    assert len(timeline) > 0
    assert "timestamp" in timeline[0]

def test_forward_reachability_exposure():
    now = datetime.now(timezone.utc)
    attack_events, _ = get_scenario_1_events(now)
    engine = DetectionEngine()
    corr = CorrelationEngine()

    db.insert_events_batch(attack_events)
    dets = engine.evaluate_events(attack_events)
    incidents = corr.correlate_batch(attack_events, dets)
    inc_id = incidents[0].incident_id

    reach = reachability_engine.analyze_reachability(inc_id)
    assert len(reach.potential_next_targets) > 0
    # DC-01 should be reachable from FS-02 via domain auth
    target_names = [t.target_asset for t in reach.potential_next_targets]
    assert any("DC" in t or "PAY" in t for t in target_names)

def test_validation_lab():
    results = run_rule_validation_suite()
    assert len(results) >= 5
    for r in results:
        assert r.passed_tests > 0
        assert r.precision >= 0.80

def test_telemetry_coverage():
    coverage = assess_telemetry_coverage()
    assert "overall_coverage_percent" in coverage
    assert len(coverage["matrix"]) >= 7

def test_independent_evaluator():
    now = datetime.now(timezone.utc)
    attack_events, _ = get_scenario_1_events(now)
    engine = DetectionEngine()
    corr = CorrelationEngine()

    db.insert_events_batch(attack_events)
    dets = engine.evaluate_events(attack_events)
    corr.correlate_batch(attack_events, dets)

    metrics = evaluator.evaluate_scenario("scenario_1")
    assert metrics["detection_recall_percent"] >= 70.0
    assert metrics["precision_percent"] >= 70.0
    assert metrics["false_positive_alarm_percent"] <= 30.0
