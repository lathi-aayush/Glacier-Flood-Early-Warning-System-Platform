import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings
from backend.db.database import engine, Base, SessionLocal
from backend.services.seed import seed_database
from backend.api.routes import health_router, lakes_router, alerts_router, features_router, simulation_router, geo_router
from backend.workers.satellite_sync import run_satellite_sync_worker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("glacierguard")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GlacierGuard database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("GlacierGuard database verified and seeded successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
    finally:
        db.close()

    satellite_task = asyncio.create_task(run_satellite_sync_worker())
    logger.info("Copernicus CDSE Sentinel-2 background worker started.")
    try:
        yield
    finally:
        satellite_task.cancel()
        try:
            await satellite_task
        except asyncio.CancelledError:
            pass
        logger.info("GlacierGuard API shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Early warning system backend fusing live weather, seismic telemetry, and satellite lake observation.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for frontend access (custom domains, Cloudflare, Render, local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["https://glacierguard.lathiaayush.com", "https://glacierguard.lathiaayush.workers.dev"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes at root (matching frontend's `/lakes` and `/alerts`)
app.include_router(health_router, tags=["Health"])
app.include_router(lakes_router, tags=["Lakes"])
app.include_router(alerts_router, tags=["Alerts"])
app.include_router(features_router, tags=["Features"])
app.include_router(simulation_router, tags=["Simulation"])
app.include_router(geo_router, tags=["Geo"])

# Also mount under /api for versioned REST consumers
app.include_router(health_router, prefix="/api", tags=["Health API"])
app.include_router(lakes_router, prefix="/api", tags=["Lakes API"])
app.include_router(alerts_router, prefix="/api", tags=["Alerts API"])
app.include_router(features_router, prefix="/api", tags=["Features API"])
app.include_router(simulation_router, prefix="/api", tags=["Simulation API"])
app.include_router(geo_router, prefix="/api", tags=["Geo API"])

@app.get("/")
def root():
    return {
        "service": "GlacierGuard API",
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "lakes": "/lakes",
            "alerts": "/alerts",
            "health": "/health",
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
