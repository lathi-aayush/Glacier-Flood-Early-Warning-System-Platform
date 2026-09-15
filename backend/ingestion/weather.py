import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from backend.core.config import settings

async def fetch_open_meteo_weather(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """
    Fetches real-time weather and forecast data from Open-Meteo API.
    Zero-authentication, ERA5 reanalysis and high-resolution global models.
    """
    params = {
        "latitude": lat,
        "longitude": lng,
        "hourly": "temperature_2m,precipitation,rain,freezing_level_height",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours",
        "timezone": "UTC",
        "forecast_days": 3,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(settings.OPEN_METEO_BASE_URL, params=params)
            if response.status_code == 200:
                return response.json()
            else:
                return None
    except Exception as e:
        print(f"[Weather Ingestion] Warning: Could not fetch weather for ({lat}, {lng}): {e}")
        return None

def analyze_weather_metrics(raw_weather: Optional[Dict[str, Any]], lake_elevation: float = 4500.0) -> Dict[str, Any]:
    """
    Parses Open-Meteo response into glacial risk indicators:
    - 24h cumulative precipitation (mm)
    - Freezing level height (m) vs lake elevation
    - Temperature range and rapid thermal thaw spike
    """
    if not raw_weather:
        # Fallback default values if offline
        return {
            "source": "fallback_offline",
            "current_temp": 1.5,
            "max_temp_24h": 6.0,
            "min_temp_24h": -4.2,
            "precip_24h_mm": 14.5,
            "freezing_level_m": 4800.0,
            "is_freezing_above_lake": True,
            "temp_spike_detected": False,
            "heavy_rainfall_alert": False,
            "precip_shap_delta": 0.05,
            "temp_shap_delta": 0.03,
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }

    hourly = raw_weather.get("hourly", {})
    daily = raw_weather.get("daily", {})

    # Extract 24-hour window
    temps = hourly.get("temperature_2m", [0.0])[:24]
    precips = hourly.get("precipitation", [0.0])[:24]
    freezing_levels = hourly.get("freezing_level_height", [4000.0])[:24]

    current_temp = temps[0] if temps else 0.0
    current_freezing_lvl = freezing_levels[0] if freezing_levels else 4000.0
    precip_24h = sum(precips) if precips else 0.0
    
    daily_max = daily.get("temperature_2m_max", [current_temp])[0]
    daily_min = daily.get("temperature_2m_min", [current_temp])[0]

    # Glacial risk triggers
    temp_spike = (daily_max - daily_min) > 10.0 or daily_max > 8.0
    heavy_rain = precip_24h > 35.0
    freezing_above = current_freezing_lvl > lake_elevation

    # Dynamic SHAP feature contribution calculation
    precip_shap = round(min(0.25, max(-0.1, (precip_24h - 10.0) * 0.005)), 2)
    temp_shap = round(min(0.20, max(-0.1, (daily_max - 2.0) * 0.02)), 2)

    return {
        "source": "open-meteo",
        "current_temp": round(current_temp, 1),
        "max_temp_24h": round(daily_max, 1),
        "min_temp_24h": round(daily_min, 1),
        "precip_24h_mm": round(precip_24h, 1),
        "freezing_level_m": round(current_freezing_lvl, 0),
        "is_freezing_above_lake": freezing_above,
        "temp_spike_detected": temp_spike,
        "heavy_rainfall_alert": heavy_rain,
        "precip_shap_delta": precip_shap,
        "temp_shap_delta": temp_shap,
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }
