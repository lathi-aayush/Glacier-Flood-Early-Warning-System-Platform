from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.db.database import get_db
from backend.ingestion.copernicus import copernicus_client
from backend.workers.satellite_sync import satellite_sync_status

router = APIRouter()

@router.get("/health")
@router.get("/status")
@router.get("/api-status")
def health_check(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {e}"

    cdse = satellite_sync_status()
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "service": "GlacierGuard API",
        "copernicus": {
            "configured": copernicus_client.is_configured(),
            "auth_mode": copernicus_client.auth_mode(),
            "catalogue_url": copernicus_client.catalog_url,
            "worker": cdse,
        },
    }
