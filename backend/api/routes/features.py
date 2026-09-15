from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.models.lake import LakeModel
from backend.models.feature_snapshot import FeatureSnapshotModel
from backend.services.feature_assembly import assemble_lake_features, assemble_all_lakes_features

router = APIRouter()

def serialize_snapshot(snap: FeatureSnapshotModel) -> Dict[str, Any]:
    return {
        "id": snap.id,
        "lakeId": snap.lake_id,
        "lake_id": snap.lake_id,
        "timestamp": snap.timestamp,
        "precip24hMm": snap.precip_24h_mm,
        "precip_24h_mm": snap.precip_24h_mm,
        "precip7dMm": snap.precip_7d_mm,
        "precip_7d_mm": snap.precip_7d_mm,
        "tempC": snap.temp_c,
        "temp_c": snap.temp_c,
        "freezingLevelM": snap.freezing_level_m,
        "freezing_level_m": snap.freezing_level_m,
        "seismicMaxMag": snap.seismic_max_mag,
        "seismic_max_mag": snap.seismic_max_mag,
        "seismicCount7d": snap.seismic_count_7d,
        "seismic_count_7d": snap.seismic_count_7d,
        "waterAreaKm2": snap.water_area_km2,
        "water_area_km2": snap.water_area_km2,
        "areaDeltaPct": snap.area_delta_pct,
        "area_delta_pct": snap.area_delta_pct,
        "cloudCoverPct": snap.cloud_cover_pct,
        "cloud_cover_pct": snap.cloud_cover_pct,
        "satelliteScene": snap.satellite_scene,
        "satellite_scene": snap.satellite_scene,
        "source": snap.source,
        "rawMetadata": snap.raw_metadata or {},
    }

@router.get("/lakes/{lake_id}/features", response_model=List[Dict[str, Any]])
def get_lake_features(
    lake_id: str,
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Returns chronological historical feature snapshots for a specific glacial lake.
    Used for trend charts (precipitation, water area delta, temperature anomalies).
    """
    lake = db.query(LakeModel).filter(LakeModel.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail=f"Lake '{lake_id}' not found")

    snapshots = (
        db.query(FeatureSnapshotModel)
        .filter(FeatureSnapshotModel.lake_id == lake_id)
        .order_by(FeatureSnapshotModel.id.desc())
        .limit(limit)
        .all()
    )
    # Return chronological order (oldest to newest) for charts
    return [serialize_snapshot(s) for s in reversed(snapshots)]


@router.post("/lakes/{lake_id}/sync-features")
async def trigger_lake_feature_sync(
    lake_id: str,
    db: Session = Depends(get_db),
):
    """
    Triggers on-demand multi-source feature ingestion and risk recalculation for a single lake.
    """
    lake = db.query(LakeModel).filter(LakeModel.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail=f"Lake '{lake_id}' not found")

    snap = await assemble_lake_features(lake, db)
    return {
        "status": "success",
        "lake_id": lake.id,
        "snapshot": serialize_snapshot(snap),
        "updated_risk_score": lake.risk_score,
        "updated_tier": lake.tier,
    }


@router.post("/lakes/sync-features-all")
async def trigger_all_lakes_feature_sync(
    db: Session = Depends(get_db),
):
    """
    Triggers batch multi-source feature assembly across all monitored glacial lakes.
    """
    return await assemble_all_lakes_features(db)
