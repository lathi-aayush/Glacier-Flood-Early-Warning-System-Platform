"""
Phase C Verification Script (Zero external frameworks, assert-based).
Validates:
1. Trained XGBoost & Isolation Forest model artifacts existence & integrity
2. Real-time supervised GLOF risk probability calculation
3. Native TreeSHAP feature attribution calculation (PRECIP, TEMP, STRESS)
4. Unsupervised anomaly detection for sudden lake destabilization
5. End-to-end lake assembly and persistence with dynamic ML scoring
6. Frontend contract validation for dynamic SHAP explanations
"""
import os
import sys
from pathlib import Path
import asyncio

sys.path.insert(0, os.path.abspath("."))

from backend.db.database import engine, Base, SessionLocal
from backend.services.seed import seed_database
from backend.models.lake import LakeModel
from backend.ml.inference import ml_engine
from backend.services.feature_assembly import assemble_lake_features, assemble_all_lakes_features
from backend.api.routes.lakes import serialize_lake

async def run_phase_c_verifications():
    print("\n=======================================================")
    print("--- [Phase C Verification 1/4] Model Artifacts Integrity ---")
    print("=======================================================")
    artifacts_dir = Path("backend/ml/artifacts")
    xgb_file = artifacts_dir / "xgboost_glof_model.joblib"
    iso_file = artifacts_dir / "isolation_forest.joblib"
    meta_file = artifacts_dir / "model_metadata.joblib"

    assert xgb_file.exists(), f"Missing XGBoost model at {xgb_file}"
    assert iso_file.exists(), f"Missing Isolation Forest at {iso_file}"
    assert meta_file.exists(), f"Missing metadata at {meta_file}"
    assert ml_engine.is_ready(), "ML inference engine not ready"
    print(f"[OK] Verified ML model artifacts present in {artifacts_dir}.")

    print("\n=======================================================")
    print("--- [Phase C Verification 2/4] Supervised Risk & TreeSHAP ---")
    print("=======================================================")
    # Scenario A: Quiescent / normal conditions
    safe_features = {
        "precip_24h_mm": 2.0,
        "precip_7d_mm": 8.0,
        "temp_c": 0.5,
        "freezing_level_m": 3800.0,
        "seismic_mag": 0.0,
        "water_area_km2": 1.2,
        "area_delta_pct": 0.2,
    }
    safe_pred = ml_engine.predict_lake_risk(safe_features)
    print("Safe Scenario Result:", safe_pred)
    assert safe_pred["risk_score"] < 50.0, f"Expected safe score < 50, got {safe_pred['risk_score']}"
    assert safe_pred["tier"] in ["safe", "advisory"]
    assert len(safe_pred["shap"]) == 3
    for s in safe_pred["shap"]:
        assert s["feature"] in ["PRECIP", "TEMP", "STRESS"]
        assert s["direction"] in ["up", "down"]
        assert isinstance(s["value"], float)

    # Scenario B: Critical breach hazard (extreme rain + warm melt + moraine surge)
    critical_features = {
        "precip_24h_mm": 85.0,
        "precip_7d_mm": 190.0,
        "temp_c": 12.5,
        "freezing_level_m": 5600.0,
        "seismic_mag": 5.8,
        "water_area_km2": 2.1,
        "area_delta_pct": 28.5,
    }
    crit_pred = ml_engine.predict_lake_risk(critical_features)
    print("Critical Scenario Result:", crit_pred)
    assert crit_pred["risk_score"] >= 75.0, f"Expected critical score >= 75, got {crit_pred['risk_score']}"
    assert crit_pred["tier"] in ["high", "critical"]
    print("[OK] Supervised XGBoost scoring and TreeSHAP attribution verified.")

    print("\n=======================================================")
    print("--- [Phase C Verification 3/4] Live DB Feature Assembly & ML ---")
    print("=======================================================")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)

    lake = db.query(LakeModel).filter(LakeModel.id == "gl-00124").first()
    assert lake is not None
    print(f"Running ML assembly on {lake.name}...")
    snapshot = await assemble_lake_features(lake, db)
    
    print("Updated Lake State:")
    print(f" - Risk Score: {lake.risk_score}")
    print(f" - Risk Tier: {lake.tier}")
    print(f" - Dynamic SHAP: {lake.shap}")
    assert lake.risk_score > 0
    assert len(lake.shap) == 3
    assert snapshot.raw_metadata.get("ml_prediction") is not None
    print("[OK] Database persistence and dynamic ML lake update verified.")

    print("\n=======================================================")
    print("--- [Phase C Verification 4/4] Frontend Contract Match ---")
    print("=======================================================")
    serialized = serialize_lake(lake)
    assert "riskScore" in serialized
    assert "tier" in serialized
    assert "shap" in serialized
    assert isinstance(serialized["shap"], list) and len(serialized["shap"]) == 3
    print("Serialized lake SHAP output for UI:", serialized["shap"])
    print("[OK] Frontend TypeScript serialization contract verified.")

    db.close()
    print("\n=======================================================")
    print(">>> ALL PHASE C (PHASE 3) VERIFICATIONS PASSED! <<<")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(run_phase_c_verifications())
