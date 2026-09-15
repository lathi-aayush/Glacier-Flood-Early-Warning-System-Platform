import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from backend.core.config import settings
from backend.db.database import engine, Base, SessionLocal
from backend.ingestion.copernicus import copernicus_client
from backend.services.satellite import sync_all_lakes_satellite
from backend.services.feature_assembly import assemble_all_lakes_features

logger = logging.getLogger("glacierguard.worker.satellite")

_status: Dict[str, Any] = {
    "running": False,
    "last_run_at": None,
    "last_status": "never",
    "last_error": None,
    "lakes_synced": 0,
    "lakes_total": 0,
    "auth_mode": "public_catalog",
    "interval_hours": None,
}


def satellite_sync_status() -> Dict[str, Any]:
    return {
        **_status,
        "configured": copernicus_client.is_configured(),
        "auth_mode": copernicus_client.auth_mode(),
        "interval_hours": getattr(settings, "SATELLITE_SYNC_INTERVAL_HOURS", 24),
    }


def _record(result: Optional[Dict[str, Any]] = None, error: Optional[str] = None) -> None:
    _status["last_run_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if error:
        _status["last_status"] = "error"
        _status["last_error"] = error
        return
    _status["last_status"] = "ok"
    _status["last_error"] = None
    if result:
        _status["lakes_synced"] = result.get("synced", 0)
        _status["lakes_total"] = result.get("total", 0)
        _status["auth_mode"] = result.get("auth_mode", copernicus_client.auth_mode())


async def run_once() -> Dict[str, Any]:
    Base.metadata.create_all(bind=engine)
    copernicus_client.reload_from_settings()
    db = SessionLocal()
    try:
        result = await sync_all_lakes_satellite(db)
        feature_result = await assemble_all_lakes_features(db)
        result["feature_snapshots"] = feature_result.get("snapshots_count", 0)
        _record(result)
        logger.info(
            "Sentinel-2 & Multi-source feature sync complete: %s/%s lakes synced, %s snapshots created (mode=%s)",
            result.get("synced"),
            result.get("total"),
            result.get("feature_snapshots"),
            result.get("auth_mode"),
        )
        return result
    except Exception as exc:
        _record(error=str(exc))
        logger.exception("Sentinel-2 sync failed: %s", exc)
        raise
    finally:
        db.close()


async def run_satellite_sync_worker() -> None:
    """
    In-process scheduler (no Redis/Celery required).

    On startup, and then every SATELLITE_SYNC_INTERVAL_HOURS (default 24h),
    fetch the exact acquisition datetime of the most recent Sentinel-2 L2A
    pass over each monitored lake.

    Authenticated CDSE credentials are used when COPERNICUS_CLIENT_ID/SECRET
    or COPERNICUS_USERNAME/PASSWORD are set. Catalog search still works
    unauthenticated.
    """
    interval_hours = float(getattr(settings, "SATELLITE_SYNC_INTERVAL_HOURS", 24) or 24)
    interval_hours = max(1.0, interval_hours)
    interval_s = interval_hours * 3600.0
    _status["running"] = True
    _status["interval_hours"] = interval_hours

    logger.info(
        "Satellite worker started (interval=%.1fh, CDSE mode=%s)",
        interval_hours,
        copernicus_client.auth_mode(),
    )
    if not copernicus_client.is_configured():
        logger.warning(
            "CDSE credentials are empty. Catalog search will run unauthenticated. "
            "Set COPERNICUS_CLIENT_ID + COPERNICUS_CLIENT_SECRET (OAuth client) "
            "or COPERNICUS_USERNAME + COPERNICUS_PASSWORD (dataspace.copernicus.eu login)."
        )

    await asyncio.sleep(2)
    while True:
        try:
            await run_once()
        except asyncio.CancelledError:
            _status["running"] = False
            logger.info("Satellite worker cancelled")
            raise
        except Exception:
            pass
        try:
            await asyncio.sleep(interval_s)
        except asyncio.CancelledError:
            _status["running"] = False
            raise
