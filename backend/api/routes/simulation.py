from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.models.lake import LakeModel
from backend.models.feature_snapshot import FeatureSnapshotModel
from backend.ml.inference import ml_engine, FEATURE_NAMES

router = APIRouter()

class SimulateScenarioRequest(BaseModel):
    lake_id: str = Field(..., description="Target lake ID (e.g. gl-00124)")
    precip_24h_mm: Optional[float] = Field(None, description="Hypothetical 24h rainfall in mm")
    precip_7d_mm: Optional[float] = Field(None, description="Hypothetical 7d cumulative rainfall in mm")
    temp_c: Optional[float] = Field(None, description="Hypothetical ambient temperature in °C")
    freezing_level_m: Optional[float] = Field(None, description="Hypothetical freezing level altitude in meters")
    seismic_mag: Optional[float] = Field(None, description="Hypothetical earthquake magnitude on Richter scale")
    water_area_km2: Optional[float] = Field(None, description="Hypothetical lake surface area in km²")
    area_delta_pct: Optional[float] = Field(None, description="Hypothetical area expansion rate %")

@router.post("/ml/simulate")
def simulate_scenario(req: SimulateScenarioRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Evaluates what-if weather and seismic scenarios against the trained XGBoost
    risk classifier and Isolation Forest anomaly detector.
    """
    lake = db.query(LakeModel).filter(LakeModel.id == req.lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail=f"Lake '{req.lake_id}' not found")

    # Fetch latest snapshot to establish current baseline
    latest_snap = (
        db.query(FeatureSnapshotModel)
        .filter(FeatureSnapshotModel.lake_id == req.lake_id)
        .order_by(FeatureSnapshotModel.timestamp.desc())
        .first()
    )

    baseline_features = {
        "precip_24h_mm": float(latest_snap.precip_24h_mm) if latest_snap else 2.0,
        "precip_7d_mm": float(latest_snap.precip_7d_mm) if latest_snap else 10.0,
        "temp_c": float(latest_snap.temp_c) if latest_snap else 1.5,
        "freezing_level_m": float(latest_snap.freezing_level_m) if latest_snap else 4800.0,
        "seismic_mag": float(latest_snap.seismic_max_mag) if latest_snap else 0.0,
        "water_area_km2": float(latest_snap.water_area_km2) if latest_snap else 1.5,
        "area_delta_pct": float(latest_snap.area_delta_pct) if latest_snap else 0.0,
    }

    # Apply overrides
    sim_features = dict(baseline_features)
    if req.precip_24h_mm is not None:
        sim_features["precip_24h_mm"] = float(req.precip_24h_mm)
        # If 7d is not explicitly provided, estimate consistent cumulative
        if req.precip_7d_mm is None:
            sim_features["precip_7d_mm"] = max(sim_features["precip_7d_mm"], float(req.precip_24h_mm) * 1.8)
    if req.precip_7d_mm is not None:
        sim_features["precip_7d_mm"] = float(req.precip_7d_mm)
    if req.temp_c is not None:
        sim_features["temp_c"] = float(req.temp_c)
        if req.freezing_level_m is None:
            # Lapse rate rule of thumb: ~150m per °C rise
            sim_features["freezing_level_m"] = round(4800.0 + (req.temp_c * 150.0), 0)
    if req.freezing_level_m is not None:
        sim_features["freezing_level_m"] = float(req.freezing_level_m)
    if req.seismic_mag is not None:
        sim_features["seismic_mag"] = float(req.seismic_mag)
    if req.water_area_km2 is not None:
        sim_features["water_area_km2"] = float(req.water_area_km2)
    if req.area_delta_pct is not None:
        sim_features["area_delta_pct"] = float(req.area_delta_pct)

    # Run ML prediction
    prediction = ml_engine.predict_lake_risk(sim_features)

    # Compute delta from current lake status
    baseline_score = round(lake.risk_score, 1)
    risk_delta = round(prediction["risk_score"] - baseline_score, 1)

    return {
        "lake_id": lake.id,
        "lake_name": lake.name,
        "baseline_risk_score": baseline_score,
        "baseline_tier": lake.tier,
        "simulated_risk_score": prediction["risk_score"],
        "simulated_tier": prediction["tier"],
        "risk_delta": risk_delta,
        "is_anomaly": prediction["is_anomaly"],
        "shap": prediction["shap"],
        "waterfall": prediction["waterfall"],
        "sop": prediction["sop"],
        "simulated_features": sim_features,
    }
