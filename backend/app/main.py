from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router
from backend.app.detection.sigma_loader import ensure_default_rules
from backend.app.simulation.scenarios import save_scenario_demo_files

app = FastAPI(
    title="Tracx — Kill Chain Intelligence",
    description="Attack Reconstruction & Forward Reachability Platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core routes
app.include_router(router)

@app.on_event("startup")
def on_startup():
    ensure_default_rules()
    save_scenario_demo_files()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
