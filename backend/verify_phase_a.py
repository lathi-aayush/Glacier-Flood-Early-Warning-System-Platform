"""
Phase A Verification Script (Zero external frameworks, assert-based).
Validates:
1. Database initialization and seeding
2. Lake and Alert query contracts matching frontend shapes
3. Open-Meteo live weather ingestion and risk calculations
4. USGS live earthquake ingestion
"""
import sys
import os
import asyncio

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.db.database import engine, Base, SessionLocal
from backend.services.seed import seed_database
from backend.models.lake import LakeModel
from backend.models.alert import AlertModel
from backend.api.routes.lakes import serialize_lake
from backend.api.routes.alerts import serialize_alert
from backend.ingestion.weather import fetch_open_meteo_weather, analyze_weather_metrics
from backend.ingestion.earthquake import fetch_usgs_earthquakes, analyze_seismic_risk

async def run_verifications():
    print("\n--- [Phase A Verification 1/4] Database Initialization & Seeding ---")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    
    lake_count = db.query(LakeModel).count()
    alert_count = db.query(AlertModel).count()
    print(f"Lakes count in database: {lake_count}")
    print(f"Alerts count in database: {alert_count}")
    assert lake_count == 6, f"Expected 6 lakes, found {lake_count}"
    assert alert_count == 4, f"Expected 4 alerts, found {alert_count}"
    print("[OK] Database and seeding verified.")

    print("\n--- [Phase A Verification 2/4] Frontend Contract Serialization ---")
    first_lake = db.query(LakeModel).first()
    assert first_lake is not None
    serialized_lake = serialize_lake(first_lake)
    
    # Check all mandatory keys required by frontend React app
    required_keys = [
        "id", "nodeId", "name", "basin", "state", "lat", "lng", 
        "riskScore", "tier", "vulnerablePop", "lastUpdated", "watchId", 
        "predictions", "telemetry", "shap", "floodProjection"
    ]
    for k in required_keys:
        assert k in serialized_lake, f"Missing key '{k}' in serialized lake"
    print("[OK] Lake serialization matches frontend TypeScript interface.")

    first_alert = db.query(AlertModel).first()
    assert first_alert is not None
    serialized_alert = serialize_alert(first_alert)
    alert_keys = ["id", "ts", "severity", "lakeName", "lakeId", "smsCount", "channels", "status"]
    for k in alert_keys:
        assert k in serialized_alert, f"Missing key '{k}' in serialized alert"
    print("[OK] Alert serialization matches frontend TypeScript interface.")

    print("\n--- [Phase A Verification 3/4] Live Open-Meteo Weather Ingestion ---")
    # Test with South Lhonak Lake coordinates (27.9158, 88.5822)
    lat, lng = first_lake.lat, first_lake.lng
    print(f"Testing live Open-Meteo fetch for {first_lake.name} ({lat}, {lng})...")
    raw_weather = await fetch_open_meteo_weather(lat, lng)
    metrics = analyze_weather_metrics(raw_weather)
    print(f"Weather metrics: Temp={metrics['current_temp']}degC, 24h Precip={metrics['precip_24h_mm']}mm, Freezing Level={metrics['freezing_level_m']}m")
    assert "current_temp" in metrics
    assert "precip_24h_mm" in metrics
    assert "freezing_level_m" in metrics
    print("[OK] Open-Meteo live weather ingestion and analysis operational.")

    print("\n--- [Phase A Verification 4/4] Live USGS Earthquake Ingestion ---")
    print(f"Testing live USGS earthquake feed for ({lat}, {lng})...")
    raw_seismic = await fetch_usgs_earthquakes(lat, lng, radius_km=300.0)
    seismic_metrics = analyze_seismic_risk(raw_seismic)
    print(f"Seismic metrics: Max Magnitude={seismic_metrics['max_magnitude']}, Trigger Risk={seismic_metrics['seismic_trigger_risk']}")
    assert "max_magnitude" in seismic_metrics
    assert "seismic_trigger_risk" in seismic_metrics
    print("[OK] USGS seismic telemetry feed operational.")

    db.close()
    print("\n==========================================")
    print("ALL PHASE A VERIFICATIONS PASSED SUCCESSFULLY!")
    print("==========================================\n")

if __name__ == "__main__":
    asyncio.run(run_verifications())
