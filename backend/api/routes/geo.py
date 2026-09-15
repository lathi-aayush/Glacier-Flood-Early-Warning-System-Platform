from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.models.lake import LakeModel
from backend.geo.flood_routing import get_lake_flood_path_geojson, get_lake_elevation_profile

router = APIRouter()

@router.get("/lakes/{lake_id}/flood-path", response_model=Dict[str, Any])
def get_flood_path(lake_id: str, db: Session = Depends(get_db)):
    """
    Returns standard GeoJSON FeatureCollection containing:
    1. Lake water body surface polygon (Polygon)
    2. Valley D8 descent flood inundation corridor (LineString)
    3. Downstream settlements at risk with arrival ETAs (Point)
    """
    lake = db.query(LakeModel).filter(LakeModel.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail=f"Lake '{lake_id}' not found")

    geojson_data = get_lake_flood_path_geojson(lake_id)
    if not geojson_data.get("features"):
        raise HTTPException(status_code=404, detail=f"No flood path profile available for lake '{lake_id}'")

    return geojson_data

@router.get("/lakes/{lake_id}/elevation-profile", response_model=Dict[str, Any])
def get_elevation_profile(lake_id: str, db: Session = Depends(get_db)):
    """
    Returns longitudinal elevation profile points along the river valley flood path
    for hydrodynamic drop analysis.
    """
    lake = db.query(LakeModel).filter(LakeModel.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail=f"Lake '{lake_id}' not found")

    profile_data = get_lake_elevation_profile(lake_id)
    return profile_data
