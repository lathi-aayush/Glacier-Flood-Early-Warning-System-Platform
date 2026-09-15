"""
Phase B Verification Script (Zero external frameworks, assert-based).
Validates:
1. Database schema migration: feature_snapshots table creation
2. ISRO Bhoonidhi EOS-04 SAR client querying & metadata synthesis
3. NDWI water area & water rise rate feature processors
4. Multi-source feature assembly & database persistence
5. Batch feature assembly across all monitored Himalayan lakes
6. Features API serialization contract matching frontend expectations
"""
import sys
import os
import asyncio

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.db.database import engine, Base, SessionLocal
from backend.services.seed import seed_database
from backend.models.lake import LakeModel
from backend.models.feature_snapshot import FeatureSnapshotModel
from backend.ingestion.bhoonidhi import bhoonidhi_client
from backend.features.ndwi import estimate_water_area, compute_water_level_rise_rate
from backend.services.feature_assembly import assemble_lake_features, assemble_all_lakes_features
from backend.api.routes.features import serialize_snapshot

async def run_phase_b_verifications():
    print("\n=======================================================")
    print("--- [Phase B Verification 1/5] Database & Schema Setup ---")
    print("=======================================================")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)

    lakes = db.query(LakeModel).all()
    print(f"Verified {len(lakes)} lakes present in database.")
    assert len(lakes) >= 6, "Expected at least 6 lakes in DB"

    print("\n=======================================================")
    print("--- [Phase B Verification 2/5] ISRO Bhoonidhi SAR Client ---")
    print("=======================================================")
    # Query for South Lhonak lake (27.9158 N, 88.5822 E)
    sar_pass = await bhoonidhi_client.fetch_latest_sar_pass(27.9158, 88.5822)
    print("Bhoonidhi SAR Output:", sar_pass)
    assert sar_pass["source"] == "ISRO Bhoonidhi EOS-04 SAR"
    assert "EOS-04" in sar_pass["collection"]
    assert "sigma0_backscatter_db" in sar_pass
    assert sar_pass["penetrates_clouds"] is True
    print("[OK] Bhoonidhi SAR client operational.")

    print("\n=======================================================")
    print("--- [Phase B Verification 3/5] NDWI & Water Dynamics Processor ---")
    print("=======================================================")
    water_area, delta_pct, sensor = estimate_water_area("gl-00124", precip_7d_mm=45.0, temp_c=8.2, cloud_cover_pct=15.0)
    rise_rate = compute_water_level_rise_rate(precip_24h_mm=22.0, area_delta_pct=delta_pct)
    print(f"South Lhonak Area: {water_area} km2 | Delta: {delta_pct}% | Sensor: {sensor} | Rise Rate: {rise_rate} m/hr")
    assert water_area > 1.0, "South Lhonak area should exceed 1.0 km2"
    assert rise_rate > 0.0, "Rise rate must be positive"
    assert sensor == "Copernicus Sentinel-2 NDWI"

    # Test cloudy condition (>30% cloud cover switches to SAR)
    _, _, cloud_sensor = estimate_water_area("gl-00124", precip_7d_mm=85.0, temp_c=9.0, cloud_cover_pct=75.0)
    print(f"Cloud-covered scene sensor selection: {cloud_sensor}")
    assert cloud_sensor == "ISRO Bhoonidhi EOS-04 SAR"
    print("[OK] Sensor selection logic and water dynamics operational.")

    print("\n=======================================================")
    print("--- [Phase B Verification 4/5] Multi-Source Feature Assembly ---")
    print("=======================================================")
    first_lake = db.query(LakeModel).filter(LakeModel.id == "gl-00124").first()
    assert first_lake is not None
    print(f"Assembling multi-source features for {first_lake.name}...")
    
    snap = await assemble_lake_features(first_lake, db)
    print("Created Snapshot ID:", snap.id)
    print(f" - Timestamp: {snap.timestamp}")
    print(f" - Precip 24h: {snap.precip_24h_mm} mm | 7d: {snap.precip_7d_mm} mm")
    print(f" - Temp: {snap.temp_c} C | Freezing Level: {snap.freezing_level_m} m")
    print(f" - Seismic Max Mag: {snap.seismic_max_mag} | Count 7d: {snap.seismic_count_7d}")
    print(f" - Water Area: {snap.water_area_km2} km2 (Delta: {snap.area_delta_pct}%)")
    print(f" - Primary Source: {snap.source}")
    print(f" - Updated Lake Risk: {first_lake.risk_score} (Tier: {first_lake.tier})")

    assert snap.id is not None
    assert snap.lake_id == "gl-00124"
    assert snap.water_area_km2 > 0
    assert first_lake.telemetry.get("waterLevelMPerHr") is not None
    assert first_lake.telemetry.get("seismicMag") is not None
    print("[OK] Single lake multi-source feature assembly verified.")

    print("\n=======================================================")
    print("--- [Phase B Verification 5/5] Batch Sync & Serialization ---")
    print("=======================================================")
    batch_res = await assemble_all_lakes_features(db)
    print("Batch assembly result:", batch_res["status"], f"({batch_res['snapshots_count']} lakes)")
    assert batch_res["status"] == "success"
    assert batch_res["snapshots_count"] >= 6

    # Verify API serialization format
    saved_snaps = db.query(FeatureSnapshotModel).filter(FeatureSnapshotModel.lake_id == "gl-00124").all()
    assert len(saved_snaps) > 0
    serialized = serialize_snapshot(saved_snaps[-1])
    required_keys = [
        "id", "lakeId", "timestamp", "precip24hMm", "precip7dMm",
        "tempC", "freezingLevelM", "seismicMaxMag", "seismicCount7d",
        "waterAreaKm2", "areaDeltaPct", "source", "rawMetadata"
    ]
    for key in required_keys:
        assert key in serialized, f"Missing key '{key}' in serialized snapshot"
    print("[OK] Feature snapshot serialization matches API contracts.")

    db.close()
    print("\n=======================================================")
    print(">>> ALL PHASE B (PHASE 2) VERIFICATIONS PASSED! <<<")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(run_phase_b_verifications())
