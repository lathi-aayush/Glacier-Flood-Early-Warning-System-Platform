import logging
from typing import Any, Dict, Optional

import httpx
from sqlalchemy.orm import Session

from backend.ingestion.copernicus import copernicus_client, parse_acquisition_datetime, format_acquisition_iso
from backend.models.lake import LakeModel

logger = logging.getLogger("glacierguard.satellite")


def apply_sentinel2_pass(lake: LakeModel, sat_pass: Dict[str, Any]) -> bool:
    """Write the exact Sentinel-2 acquisition timestamp onto the lake row."""
    acq_raw = sat_pass.get("acquisition_timestamp")
    acq_dt = parse_acquisition_datetime(acq_raw, sat_pass.get("product_name"))
    if acq_dt is None:
        return False

    lake.last_updated = format_acquisition_iso(acq_dt)
    weather_data = dict(lake.weather_data or {})
    weather_data["satellite"] = sat_pass
    lake.weather_data = weather_data
    return True


async def sync_lake_satellite(
    lake: LakeModel,
    *,
    client: Optional[httpx.AsyncClient] = None,
) -> Optional[Dict[str, Any]]:
    sat_pass = await copernicus_client.fetch_latest_sentinel2_pass(lake.lat, lake.lng, client=client)
    if sat_pass and apply_sentinel2_pass(lake, sat_pass):
        logger.info(
            "Sentinel-2 pass for %s: %s (%s)",
            lake.name,
            sat_pass.get("acquisition_timestamp"),
            sat_pass.get("product_name"),
        )
        return sat_pass
    logger.warning("No Sentinel-2 L2A scene found for %s (%s, %s)", lake.name, lake.lat, lake.lng)
    return None


async def sync_all_lakes_satellite(db: Session) -> Dict[str, Any]:
    lakes = db.query(LakeModel).all()
    results = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for lake in lakes:
            sat_pass = await sync_lake_satellite(lake, client=client)
            results.append(
                {
                    "id": lake.id,
                    "name": lake.name,
                    "last_updated": lake.last_updated,
                    "satellite_scene": (sat_pass or {}).get("product_name"),
                    "acquisition_timestamp": (sat_pass or {}).get("acquisition_timestamp"),
                    "authenticated": bool((sat_pass or {}).get("is_authenticated")),
                }
            )
    db.commit()
    found = sum(1 for r in results if r.get("acquisition_timestamp"))
    return {
        "status": "success",
        "synced": found,
        "total": len(results),
        "authenticated": copernicus_client.is_configured() and any(r.get("authenticated") for r in results),
        "auth_mode": copernicus_client.auth_mode(),
        "synced_lakes": results,
    }
