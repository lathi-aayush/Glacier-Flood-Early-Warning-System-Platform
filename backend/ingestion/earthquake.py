import httpx
from typing import Dict, Any, Optional
from backend.core.config import settings

async def fetch_usgs_earthquakes(lat: float, lng: float, radius_km: float = 200.0) -> Optional[Dict[str, Any]]:
    """
    Fetches seismic events from USGS Earthquake API within radius around lake coordinates.
    Zero-authentication, standard FDSN GeoJSON format.
    """
    params = {
        "format": "geojson",
        "latitude": lat,
        "longitude": lng,
        "maxradiuskm": radius_km,
        "minmagnitude": 2.0,
        "limit": 5,
        "orderby": "time",
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(settings.USGS_EARTHQUAKE_URL, params=params)
            if res.status_code == 200:
                return res.json()
            return None
    except Exception as e:
        print(f"[Earthquake Ingestion] Warning: Could not fetch seismic data for ({lat}, {lng}): {e}")
        return None

def analyze_seismic_risk(geojson_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates maximum seismic magnitude and trigger risk for moraine dam integrity.
    """
    if not geojson_data or "features" not in geojson_data or not geojson_data["features"]:
        return {
            "max_magnitude": 0.0,
            "event_count": 0,
            "recent_event": None,
            "seismic_trigger_risk": "low"
        }

    features = geojson_data["features"]
    max_mag = 0.0
    latest_event = None

    for feat in features:
        props = feat.get("properties", {})
        mag = props.get("mag") or 0.0
        if mag > max_mag:
            max_mag = mag
        if not latest_event:
            latest_event = {
                "place": props.get("place", "Regional fault zone"),
                "mag": mag,
                "time": props.get("time")
            }

    risk_level = "low"
    if max_mag >= 5.0:
        risk_level = "critical"
    elif max_mag >= 3.5:
        risk_level = "elevated"

    return {
        "max_magnitude": round(max_mag, 1),
        "event_count": len(features),
        "recent_event": latest_event,
        "seismic_trigger_risk": risk_level
    }
