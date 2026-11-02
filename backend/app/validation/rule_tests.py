from typing import List, Dict, Any
from backend.app.schemas import NormalizedEvent, RuleValidationResult
from backend.app.detection.engine import DetectionEngine
from backend.app.detection.sigma_loader import load_all_rules

def run_rule_validation_suite() -> List[RuleValidationResult]:
    """
    Executes actual functional test cases against all loaded detection rules.
    Tests positive true positives, negative true negatives, missing fields, and noisy inputs.
    """
    rules = load_all_rules()
    test_engine = DetectionEngine()
    results: List[RuleValidationResult] = []

    for rule in rules:
        rule_id = rule["id"]
        title = rule.get("title", rule_id)
        selection = rule.get("detection", {}).get("selection", {})

        tp = 0
        fp = 0
        tn = 0
        fn = 0
        observations = []

        # 1. Positive Test Case (True Positive Target)
        positive_event = _synthesize_positive_event(rule_id, selection)
        dets_pos = test_engine.evaluate_events([positive_event])
        if any(d.rule_id == rule_id for d in dets_pos):
            tp += 1
            observations.append("Positive sample correctly detected.")
        else:
            fn += 1
            observations.append("Warning: Positive sample failed to trigger detection.")

        # 2. Negative Test Case (Benign Normal Event)
        negative_event = NormalizedEvent(
            event_id=f"test-neg-{rule_id}",
            timestamp="2026-10-31T12:00:00Z",
            source="windows_sysmon",
            source_type="endpoint",
            host="WS-BENIGN-01",
            user="alice.normal",
            process_name="notepad.exe",
            parent_process="explorer.exe",
            command_line="notepad.exe C:\\Users\\alice\\notes.txt",
            event_type="process_creation",
            action="process_created"
        )
        dets_neg = test_engine.evaluate_events([negative_event])
        if not any(d.rule_id == rule_id for d in dets_neg):
            tn += 1
            observations.append("Benign control sample produced no false alert.")
        else:
            fp += 1
            observations.append("Warning: Benign event incorrectly flagged as threat.")

        # 3. Missing Field Robustness Test
        missing_event = NormalizedEvent(
            event_id=f"test-missing-{rule_id}",
            timestamp="2026-10-31T12:00:01Z",
            source="syslog",
            source_type="unknown",
            host=None,
            user=None,
            process_name=None,
            command_line=None
        )
        dets_miss = test_engine.evaluate_events([missing_event])
        if not any(d.rule_id == rule_id for d in dets_miss):
            tn += 1
            observations.append("Robust against missing or null schema fields.")
        else:
            fp += 1

        # 4. Partial Substring Variation Test (Negative or Edge)
        noisy_event = NormalizedEvent(
            event_id=f"test-noisy-{rule_id}",
            timestamp="2026-10-31T12:00:02Z",
            source="windows_sysmon",
            source_type="endpoint",
            host="WS-NOISY-02",
            user="bob.dev",
            process_name="clean_utility.exe",
            command_line="clean_utility.exe --no-threat-data"
        )
        dets_noisy = test_engine.evaluate_events([noisy_event])
        if not any(d.rule_id == rule_id for d in dets_noisy):
            tn += 1
        else:
            fp += 1

        total = tp + fp + tn + fn
        passed = tp + tn
        precision = round(tp / (tp + fp), 2) if (tp + fp) > 0 else 1.0
        recall = round(tp / (tp + fn), 2) if (tp + fn) > 0 else 0.0
        fpr = round(fp / (fp + tn), 2) if (fp + tn) > 0 else 0.0
        fnr = round(fn / (fn + tp), 2) if (fn + tp) > 0 else 0.0

        results.append(RuleValidationResult(
            rule_id=rule_id,
            rule_name=title,
            total_tests=total,
            passed_tests=passed,
            failed_tests=total - passed,
            precision=precision,
            recall=recall,
            false_positive_rate=fpr,
            false_negative_rate=fnr,
            observations=observations
        ))

    return results

def _synthesize_positive_event(rule_id: str, selection: Dict[str, Any]) -> NormalizedEvent:
    ev = NormalizedEvent(
        event_id=f"val-pos-{rule_id}",
        timestamp="2026-10-31T12:00:00Z",
        source="windows_sysmon",
        source_type="endpoint",
        host="WS-LAB-01",
        user="test_target_user",
        event_type="process_creation",
        action="observed"
    )
    for k, v in selection.items():
        val = v[0] if isinstance(v, list) else v
        field = k.split("|")[0]
        if field == "process_name":
            ev.process_name = val
        elif field == "command_line":
            ev.command_line = f"utility.exe {val}"
        elif field == "action":
            ev.action = val
        elif field == "destination_port":
            ev.destination_port = int(val)
        else:
            ev.additional_fields[field] = val
    return ev
