import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import httpx
from sqlalchemy.orm import Session

from backend.models.lake import LakeModel
from backend.models.feature_snapshot import FeatureSnapshotModel
from backend.ingestion.weather import fetch_open_meteo_weather, analyze_weather_metrics
from backend.ingestion.earthquake import fetch_usgs_earthquakes, analyze_seismic_risk
from backend.ingestion.copernicus import copernicus_client, format_acquisition_iso, parse_acquisition_datetime
from backend.ingestion.bhoonidhi import bhoonidhi_client
from backend.features.ndwi import estimate_water_area, compute_water_level_rise_rate
from backend.ml.inference import ml_engine

logger = logging.getLogger("glacierguard.features")

def calculate_composite_risk_score(
    precip_24h: float,
    precip_7d: float,
    temp_c: float,
    freezing_level: float,
    seismic_mag: float,
    area_delta_pct: float,
) -> Tuple[float, str]:
    """
    Compute multi-factor GLOF risk score (0 - 100) and risk tier.
    Weights:
    - Area expansion delta (moraine stretch): 35%
    - Extreme 24h/7d precipitation: 30%
    - Seismic trigger magnitude: 20%
    - Warm temperature / high freezing level: 15%
    """
    area_component = min(35.0, max(0.0, (area_delta_pct / 15.0) * 35.0))
    precip_component = min(30.0, max(0.0, ((precip_24h * 0.7 + precip_7d * 0.3) / 80.0) * 30.0))
    seismic_component = min(20.0, max(0.0, ((seismic_mag - 2.0) / 4.0) * 20.0)) if seismic_mag >= 2.0 else 0.0
    thermal_component = min(15.0, max(0.0, ((temp_c - 0.0) / 15.0) * 15.0))

    score = round(area_component + precip_component + seismic_component + thermal_component, 1)
    score = max(5.0, min(99.0, score))

    if score >= 80.0:
        tier = "critical"
    elif score >= 50.0:
        tier = "high"
    elif score >= 25.0:
        tier = "advisory"
    else:
        tier = "safe"

    return score, tier


async def assemble_lake_features(
    lake: LakeModel,
    db: Session,
    *,
    client: Optional[httpx.AsyncClient] = None,
) -> FeatureSnapshotModel:
    """
    Execute full multi-source sensor assembly for a single glacial lake:
    1. Open-Meteo weather
    2. USGS seismic
    3. Copernicus Sentinel-2 optical pass
    4. ISRO Bhoonidhi EOS-04 SAR pass
    5. Morphological NDWI water area & water rise rate
    6. Persist to feature_snapshots table & update lake live state
    """
    owns_client = client is None
    http = client or httpx.AsyncClient(timeout=30.0)

    try:
        # 1. Weather Ingestion
        raw_weather = await fetch_open_meteo_weather(lake.lat, lake.lng)
        weather = analyze_weather_metrics(raw_weather)
        precip_24h = weather.get("precip_24h_mm", 0.0)
        precip_7d = weather.get("precip_7d_mm", 0.0)
        temp_c = weather.get("current_temp", 0.0)
        freezing_lvl = weather.get("freezing_level_m", 0.0)

        # 2. Seismic Ingestion
        raw_seismic = await fetch_usgs_earthquakes(lake.lat, lake.lng, radius_km=300.0)
        seismic = analyze_seismic_risk(raw_seismic)
        seismic_mag = seismic.get("max_magnitude", 0.0)
        seismic_count = seismic.get("earthquake_count", 0)

        # 3. Satellite Ingestion (Sentinel-2 + Bhoonidhi SAR)
        s2_pass = await copernicus_client.fetch_latest_sentinel2_pass(lake.lat, lake.lng, client=http)
        sar_pass = await bhoonidhi_client.fetch_latest_sar_pass(lake.lat, lake.lng, client=http)

        cloud_cover = (s2_pass or {}).get("cloud_cover_pct")
        water_area, area_delta, primary_sensor = estimate_water_area(
            lake.id, precip_7d, temp_c, cloud_cover
        )
        water_rise_rate = compute_water_level_rise_rate(precip_24h, area_delta)

        # 4. Supervised ML Risk Prediction & TreeSHAP Attribution
        features_payload = {
            "precip_24h_mm": precip_24h,
            "precip_7d_mm": precip_7d,
            "temp_c": temp_c,
            "freezing_level_m": freezing_lvl,
            "seismic_mag": seismic_mag,
            "water_area_km2": water_area,
            "area_delta_pct": area_delta,
        }
        ml_res = ml_engine.predict_lake_risk(features_payload)
        risk_score = ml_res["risk_score"]
        tier = ml_res["tier"]
        shap_factors = ml_res["shap"]

        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        chosen_scene = (s2_pass or {}).get("product_name") or (sar_pass or {}).get("product_name")

        # 5. Create Feature Snapshot Record
        snapshot = FeatureSnapshotModel(
            lake_id=lake.id,
            timestamp=now_iso,
            precip_24h_mm=precip_24h,
            precip_7d_mm=precip_7d,
            temp_c=temp_c,
            freezing_level_m=freezing_lvl,
            seismic_max_mag=seismic_mag,
            seismic_count_7d=seismic_count,
            water_area_km2=water_area,
            area_delta_pct=area_delta,
            cloud_cover_pct=cloud_cover,
            satellite_scene=chosen_scene,
            source=primary_sensor,
            raw_metadata={
                "weather": weather,
                "seismic": seismic,
                "sentinel2": s2_pass,
                "bhoonidhi_sar": sar_pass,
                "water_rise_rate_m_hr": water_rise_rate,
                "ml_prediction": ml_res,
            },
        )
        db.add(snapshot)

        # 6. Update Lake Row State with ML outputs
        lake.risk_score = risk_score
        lake.tier = tier
        lake.shap = shap_factors
        lake.last_updated = (s2_pass or {}).get("acquisition_timestamp") or now_iso
        lake.telemetry = {
            "waterLevelMPerHr": water_rise_rate,
            "seismicMag": seismic_mag,
            "areaDeltaPct": area_delta,
        }
        lake_weather = dict(lake.weather_data or {})
        lake_weather.update({
            "weather_summary": weather,
            "seismic_summary": seismic,
            "satellite": s2_pass or sar_pass,
            "sar_backup": sar_pass,
            "water_area_km2": water_area,
            "primary_sensor": primary_sensor,
        })
        lake.weather_data = lake_weather

        db.commit()
        db.refresh(snapshot)
        logger.info(
            "Assembled snapshot for %s: Risk=%s (%s), Rain=%.1fmm, AreaDelta=%.1f%%",
            lake.name, risk_score, tier, precip_24h, area_delta
        )
        return snapshot
    finally:
        if owns_client:
            await http.aclose()


async def assemble_all_lakes_features(db: Session) -> Dict[str, Any]:
    """Batch assemble features for all monitored lakes in the database."""
    lakes = db.query(LakeModel).all()
    snapshots = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for lake in lakes:
            snap = await assemble_lake_features(lake, db, client=client)
            snapshots.append({
                "lake_id": lake.id,
                "name": lake.name,
                "risk_score": lake.risk_score,
                "tier": lake.tier,
                "source": snap.source,
                "water_area_km2": snap.water_area_km2,
                "area_delta_pct": snap.area_delta_pct,
                "satellite_scene": snap.satellite_scene,
                "snapshot_id": snap.id,
            })
    return {
        "status": "success",
        "snapshots_count": len(snapshots),
        "lakes": snapshots,
    }
