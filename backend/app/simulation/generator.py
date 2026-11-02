import asyncio
import time
import threading
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timezone
from backend.app.schemas import NormalizedEvent
from backend.app.simulation.scenarios import (
    get_scenario_1_events, get_scenario_2_events, get_scenario_3_events,
    generate_background_event, save_scenario_demo_files
)
from backend.app.storage import db
from backend.app.detection.engine import detection_engine
from backend.app.correlation.incident_builder import correlation_engine

class LiveSimulationGenerator:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LiveSimulationGenerator, cls).__new__(cls)
            cls._instance._init_generator()
        return cls._instance

    def _init_generator(self):
        self.status = "stopped"  # "running", "paused", "stopped"
        self.scenario_id = "scenario_1"
        self.event_rate = 4.0  # events per second
        self.events_emitted = 0
        self.thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._pause_event = threading.Event()
        self._pause_event.set()  # Not paused initially
        self.subscribers: List[Callable[[Dict[str, Any]], None]] = []
        save_scenario_demo_files()

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        if callback not in self.subscribers:
            self.subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[Dict[str, Any]], None]):
        if callback in self.subscribers:
            self.subscribers.remove(callback)

    def _broadcast(self, msg: Dict[str, Any]):
        for sub in list(self.subscribers):
            try:
                sub(msg)
            except Exception:
                pass

    def start(self, scenario_id: str = "scenario_1", event_rate: float = 4.0):
        if self.status == "running":
            return {"status": "already_running"}

        self.scenario_id = scenario_id
        self.event_rate = max(0.5, min(50.0, float(event_rate)))
        self._stop_event.clear()
        self._pause_event.set()
        self.status = "running"

        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        return {"status": "started", "scenario": scenario_id, "rate": self.event_rate}

    def pause(self):
        if self.status == "running":
            self._pause_event.clear()
            self.status = "paused"
            return {"status": "paused"}
        return {"status": self.status}

    def resume(self):
        if self.status == "paused":
            self._pause_event.set()
            self.status = "running"
            return {"status": "resumed"}
        return {"status": self.status}

    def stop(self):
        self._stop_event.set()
        self._pause_event.set()
        self.status = "stopped"
        return {"status": "stopped", "events_emitted": self.events_emitted}

    def reset(self):
        self.stop()
        db.reset_all()
        self.events_emitted = 0
        return {"status": "reset_completed"}

    def _run_loop(self):
        now = datetime.now(timezone.utc)
        scenario_map = {
            "scenario_1": get_scenario_1_events,
            "scenario_2": get_scenario_2_events,
            "scenario_3": get_scenario_3_events
        }
        gen_fn = scenario_map.get(self.scenario_id, get_scenario_1_events)
        attack_events, _ = gen_fn(now)

        attack_idx = 0
        bg_counter = 0

        while not self._stop_event.is_set():
            self._pause_event.wait()
            if self._stop_event.is_set():
                break

            # Interleave 1 attack event every ~3 background events
            now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            if attack_idx < len(attack_events) and (bg_counter % 3 == 0):
                ev = attack_events[attack_idx]
                # Update timestamp to live current time
                ev.timestamp = now_iso
                attack_idx += 1
                is_attack = True
            else:
                ev = generate_background_event(datetime.now(timezone.utc), 0)
                is_attack = False

            bg_counter += 1
            self.events_emitted += 1

            # 1. Insert into DuckDB
            db.insert_events_batch([ev])

            # 2. Evaluate Detections
            new_dets = detection_engine.evaluate_events([ev])

            # 3. Correlate
            updated_incidents = correlation_engine.correlate_batch([ev], new_dets)

            # 4. Notify live subscribers
            payload = {
                "type": "event_update",
                "event": ev.model_dump(),
                "is_attack": is_attack,
                "new_detections": [d.model_dump() for d in new_dets],
                "updated_incidents": [inc.model_dump() for inc in updated_incidents],
                "events_emitted": self.events_emitted
            }
            self._broadcast(payload)

            # Sleep interval according to event_rate
            time.sleep(1.0 / self.event_rate)

            # If attack sequence completed, continue background traffic at lower cadence
            if attack_idx >= len(attack_events) and (bg_counter > len(attack_events) + 30):
                time.sleep(0.5)

        self.status = "stopped"

live_simulator = LiveSimulationGenerator()
