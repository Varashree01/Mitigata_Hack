import time
import uuid
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
from backend.app.schemas import IngestionRun
from backend.app.storage import db
from backend.app.ingestion.parsers import read_chunks_from_file
from backend.app.detection.engine import detection_engine
from backend.app.correlation.incident_builder import correlation_engine

def process_file_stream(file_path: Path, source_hint: str = "auto", chunk_size: int = 5000) -> IngestionRun:
    run_id = f"run-{uuid.uuid4().hex[:8]}"
    t0 = time.time()
    total_events = 0
    dropped_events = 0

    run = IngestionRun(
        run_id=run_id,
        filename=file_path.name,
        source_type=source_hint,
        total_events=0,
        processed_events=0,
        dropped_events=0,
        duration_seconds=0.0,
        status="processing",
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    db.record_ingestion_run(run)

    try:
        for chunk in read_chunks_from_file(file_path, chunk_size=chunk_size, source_hint=source_hint):
            if not chunk:
                continue
            # 1. Store events in DuckDB
            db.insert_events_batch(chunk)
            # 2. Run detection rules
            detections = detection_engine.evaluate_events(chunk)
            # 3. Correlate detections & events into incidents
            correlation_engine.correlate_batch(chunk, detections)
            total_events += len(chunk)

        elapsed = round(time.time() - t0, 3)
        run.status = "completed"
        run.total_events = total_events
        run.processed_events = total_events
        run.dropped_events = dropped_events
        run.duration_seconds = elapsed
        db.record_ingestion_run(run)
        return run

    except Exception as e:
        elapsed = round(time.time() - t0, 3)
        run.status = f"failed: {str(e)}"
        run.duration_seconds = elapsed
        db.record_ingestion_run(run)
        return run
