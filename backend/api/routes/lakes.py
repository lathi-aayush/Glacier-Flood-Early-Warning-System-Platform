from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.models.lake import LakeModel
from backend.ingestion.weather import fetch_open_meteo_weather, analyze_weather_metrics
from backend.ingestion.earthquake import fetch_usgs_earthquakes, analyze_seismic_risk
from backend.ingestion.copernicus import copernicus_client
from backend.services.satellite import apply_sentinel2_pass, sync_all_lakes_satellite

router = APIRouter()

def serialize_lake(lake: LakeModel) -> Dict[str, Any]:
    weather = lake.weather_data or {}
    satellite = weather.get("satellite") if isinstance(weather, dict) else None
    return {
        "id": lake.id,
        "nodeId": lake.node_id,
        "node_id": lake.node_id,
        "name": lake.name,
        "basin": lake.basin,
        "state": lake.state,
        "lat": lake.lat,
        "lng": lake.lng,
        "riskScore": round(lake.risk_score, 1),
        "risk_score": round(lake.risk_score, 1),
        "tier": lake.tier,
        "vulnerablePop": lake.vulnerable_pop,
        "vulnerable_pop": lake.vulnerable_pop,
        "lastUpdated": lake.last_updated,
        "last_updated": lake.last_updated,
        "watchId": lake.watch_id,
        "watch_id": lake.watch_id,
        "predictions": lake.predictions or {"h72": 0, "h24": 0, "h6": 0},
        "telemetry": lake.telemetry or {"waterLevelMPerHr": 0, "seismicMag": 0, "areaDeltaPct": 0},
        "shap": lake.shap or [],
        "floodProjection": lake.flood_projection or [],
        "escalationLevel": lake.escalation_level,
        "escalation_level": lake.escalation_level,
        "smsSent": lake.sms_sent,
        "sms_sent": lake.sms_sent,
        "weatherData": weather,
        "satellitePass": satellite,
        "satellite_pass": satellite,
    }

@router.get("/lakes", response_model=List[Dict[str, Any]])
def list_lakes(db: Session = Depends(get_db)):
    """Returns all monitored glacial lakes."""
    lakes = db.query(LakeModel).order_by(LakeModel.risk_score.desc()).all()
    return [serialize_lake(l) for l in lakes]

@router.get("/lakes/{lake_id}", response_model=Dict[str, Any])
def get_lake(lake_id: str, db: Session = Depends(get_db)):
    """Returns details for a single glacial lake."""
    lake = db.query(LakeModel).filter(LakeModel.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail=f"Lake '{lake_id}' not found")
    return serialize_lake(lake)

@router.post("/lakes/{lake_id}/sync-weather")
async def sync_lake_weather(lake_id: str, db: Session = Depends(get_db)):
    """
    Fetches real-time Open-Meteo weather and USGS seismic data for the lake,
    updates telemetry, dynamic SHAP features, and re-evaluates risk score.
    """
    lake = db.query(LakeModel).filter(LakeModel.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail=f"Lake '{lake_id}' not found")

    # Ingest live feeds
    raw_weather = await fetch_open_meteo_weather(lake.lat, lake.lng)
    weather_summary = analyze_weather_metrics(raw_weather)
    
    raw_seismic = await fetch_usgs_earthquakes(lake.lat, lake.lng)
    seismic_summary = analyze_seismic_risk(raw_seismic)

    # Update telemetry dict
    telemetry = dict(lake.telemetry or {})
    if seismic_summary["max_magnitude"] > 0:
        telemetry["seismicMag"] = seismic_summary["max_magnitude"]
    lake.telemetry = telemetry

    # Update SHAP contributions dynamically
    shap_items = [
        {
            "feature": "PRECIP",
            "value": weather_summary["precip_shap_delta"],
            "direction": "up" if weather_summary["precip_shap_delta"] >= 0 else "down"
        },
        {
            "feature": "TEMP",
            "value": weather_summary["temp_shap_delta"],
            "direction": "up" if weather_summary["temp_shap_delta"] >= 0 else "down"
        },
        {
            "feature": "STRESS",
            "value": round((telemetry.get("seismicMag", 1.0) - 2.0) * 0.03, 2),
            "direction": "up" if telemetry.get("seismicMag", 1.0) >= 2.0 else "down"
        },
    ]
    lake.shap = shap_items

    # Compute risk score modification from live weather triggers
    score_delta = 0.0
    if weather_summary.get("heavy_rainfall_alert"):
        score_delta += 12.0
    if weather_summary.get("temp_spike_detected"):
        score_delta += 6.0
    if seismic_summary.get("seismic_trigger_risk") == "critical":
        score_delta += 20.0
    elif seismic_summary.get("seismic_trigger_risk") == "elevated":
        score_delta += 8.0

    # Bounded score
    base_score = lake.risk_score
    new_score = round(min(99.4, max(5.0, base_score + score_delta)), 1)
    lake.risk_score = new_score

    # Assign risk tier
    if new_score >= 80.0:
        lake.tier = "critical"
    elif new_score >= 60.0:
        lake.tier = "high"
    elif new_score >= 35.0:
        lake.tier = "advisory"
    else:
        lake.tier = "safe"

    weather_payload = dict(lake.weather_data or {})
    satellite_meta = weather_payload.get("satellite") if isinstance(weather_payload, dict) else None
    # Preserve Sentinel-2 acquisition timestamp as last_updated when a pass is stored.
    if not (isinstance(satellite_meta, dict) and satellite_meta.get("acquisition_timestamp")):
        lake.last_updated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    weather_payload["weather"] = weather_summary
    weather_payload["seismic"] = seismic_summary
    lake.weather_data = weather_payload

    db.commit()
    db.refresh(lake)

    return {
        "status": "success",
        "lake_id": lake.id,
        "new_risk_score": lake.risk_score,
        "new_tier": lake.tier,
        "weather_summary": weather_summary,
        "seismic_summary": seismic_summary,
        "updated_at": lake.last_updated
    }

@router.post("/lakes/{lake_id}/sync-satellite")
async def sync_lake_satellite(lake_id: str, db: Session = Depends(get_db)):
    """
    Queries Copernicus CDSE for the most recent Sentinel-2 Level-2A optical pass
    over this lake, records the exact acquisition timestamp, and updates last_updated.
    """
    lake = db.query(LakeModel).filter(LakeModel.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail=f"Lake '{lake_id}' not found")

    sat_pass = await copernicus_client.fetch_latest_sentinel2_pass(lake.lat, lake.lng)
    if sat_pass and apply_sentinel2_pass(lake, sat_pass):
        db.commit()
        db.refresh(lake)

        return {
            "status": "success",
            "lake_id": lake.id,
            "satellite_pass": sat_pass,
            "last_updated": lake.last_updated,
        }

    return {
        "status": "warning",
        "message": "No new Sentinel-2 scene found or CDSE catalog temporarily unreachable.",
        "lake_id": lake.id,
        "last_updated": lake.last_updated,
    }

@router.post("/lakes/sync-all")
async def sync_all_lakes(db: Session = Depends(get_db)):
    """
    Syncs live Sentinel-2 satellite pass and weather for all monitored lakes.
    """
    return await sync_all_lakes_satellite(db)

