from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
PARQUET_DIR = STORAGE_DIR / "parquet"
DUCKDB_PATH = STORAGE_DIR / "events.duckdb"
SQLITE_PATH = STORAGE_DIR / "incidents.db"
RULES_DIR = BASE_DIR / "backend" / "rules"
GROUND_TRUTH_DIR = BASE_DIR / "ground_truth"
DEMO_DATA_DIR = BASE_DIR / "demo_data"

# Ensure directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
PARQUET_DIR.mkdir(parents=True, exist_ok=True)
RULES_DIR.mkdir(parents=True, exist_ok=True)
GROUND_TRUTH_DIR.mkdir(parents=True, exist_ok=True)
DEMO_DATA_DIR.mkdir(parents=True, exist_ok=True)

# Performance & Ingestion Configurations
DEFAULT_BATCH_SIZE = int(os.getenv("BATCH_SIZE", "10000"))
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "2048"))
CORRELATION_TIME_WINDOW_MINUTES = int(os.getenv("CORRELATION_WINDOW_MIN", "120"))
SIMULATION_DEFAULT_RATE = float(os.getenv("SIM_DEFAULT_RATE", "5.0")) # events/sec

# Optional LLM integration
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "deterministic") # 'deterministic', 'openai', 'gemini'
