import asyncio
import os
import sys

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.core.config import settings, reload_settings
from backend.db.database import engine, Base, SessionLocal
from backend.services.seed import seed_database
from backend.models.lake import LakeModel
from backend.ingestion.copernicus import copernicus_client, parse_acquisition_datetime
from backend.workers.satellite_sync import run_once, satellite_sync_status
from backend.api.routes.lakes import serialize_lake

async def main():
    print("=== [Test 1/4] Checking Copernicus Client Configuration & Reload ===")
    copernicus_client.reload_from_settings()
    is_conf = copernicus_client.is_configured()
    mode = copernicus_client.auth_mode()
    print(f"Configured: {is_conf}, Auth mode: {mode}")

    print("\n=== [Test 2/4] Fetching Latest Sentinel-2 Pass for South Lhonak Lake ===")
    # South Lhonak coords: 27.9158 N, 88.5822 E
    sat_pass = await copernicus_client.fetch_latest_sentinel2_pass(27.9158, 88.5822)
    assert sat_pass is not None, "Failed to retrieve Sentinel-2 pass from CDSE"
    print("CDSE Result:")
    print(" - Product Name:", sat_pass["product_name"])
    print(" - Acquisition Timestamp:", sat_pass["acquisition_timestamp"])
    print(" - Product ID:", sat_pass["product_id"])
    print(" - Auth Mode:", sat_pass["auth_mode"])
    assert "202" in sat_pass["acquisition_timestamp"], "Invalid acquisition timestamp format"
    assert "_MSIL2A_" in sat_pass["product_name"], "Product is not Sentinel-2 Level-2A"

    print("\n=== [Test 3/4] Running Satellite Worker Cycle Across All Lakes ===")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()

    worker_result = await run_once()
    print("Worker result:", worker_result)
    assert worker_result["status"] == "success"
    assert worker_result["synced"] > 0, "No lakes were synced"
    print(f"Worker successfully synced {worker_result['synced']}/{worker_result['total']} lakes.")

    print("\n=== [Test 4/4] Verifying Lake Persistence & Serialization Contract ===")
    db = SessionLocal()
    lakes = db.query(LakeModel).all()
    for lake in lakes:
        serialized = serialize_lake(lake)
        print(f"Lake: {lake.name:<18} | Last Updated: {lake.last_updated} | Scene: {(serialized.get('satellitePass') or {}).get('product_name', 'None')[:35]}")
        assert lake.last_updated is not None and len(lake.last_updated) > 0
        assert serialized.get("satellitePass") is not None
        assert serialized["satellitePass"].get("acquisition_timestamp") is not None
    db.close()

    status = satellite_sync_status()
    print("\nSatellite Worker Status Report:", status)
    assert status["last_status"] == "ok"
    assert status["lakes_synced"] == len(lakes)

    print("\n>>> ALL COPERNICUS CDSE SATELLITE SYNC TESTS PASSED! <<<")

if __name__ == "__main__":
    asyncio.run(main())
