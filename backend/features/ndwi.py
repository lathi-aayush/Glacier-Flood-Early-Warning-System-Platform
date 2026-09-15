from typing import Dict, Any, Tuple

# Historical baseline surface area (km²) for monitored lakes
HISTORICAL_LAKE_BASELINES_KM2: Dict[str, float] = {
    "gl-00124": 1.68,   # South Lhonak Lake (Sikkim) - grew rapidly prior to 2023 outburst
    "gl-00452": 0.52,   # Ghepan Ghat (Himachal Pradesh)
    "gl-00089": 1.35,   # Imja Tsho (Everest region)
    "gl-00215": 1.48,   # Tsho Rolpa (Rolwaling valley)
    "gl-00331": 0.85,   # Pareechu Lake (Tibet/Himachal border)
    "gl-ct-12": 0.45,   # Chandra Tal (Spiti)
}

def estimate_water_area(
    lake_id: str,
    precip_7d_mm: float,
    temp_c: float,
    cloud_cover_pct: float | None = None,
) -> Tuple[float, float, str]:
    """
    Estimate current lake surface area (km²) and area expansion delta (%).
    
    Combines:
    1. Historical lake perimeter baseline
    2. Monsoon/melt expansion physics (temperature anomaly + precipitation runoff)
    3. Optical NDWI vs SAR selection (cloud > 30% prioritizes SAR)
    
    Returns: (current_area_km2, area_delta_pct, primary_sensor)
    """
    baseline = HISTORICAL_LAKE_BASELINES_KM2.get(lake_id, 0.90)
    
    # Runoff expansion factor: 100mm rain ~ 2-4% water spread in steep moraines
    rain_effect = (precip_7d_mm / 100.0) * 0.04
    
    # Thermal ablation factor: Temps above 5C accelerate glacial ice melt into lake
    melt_effect = max(0.0, (temp_c - 2.0) * 0.008)
    
    expansion_factor = max(-0.05, min(0.35, rain_effect + melt_effect))
    current_area = round(baseline * (1.0 + expansion_factor), 3)
    area_delta_pct = round(expansion_factor * 100.0, 1)
    
    # Sensor selection logic: optical Sentinel-2 preferred under clear skies,
    # SAR selected when cloud cover exceeds 30%
    if cloud_cover_pct is not None and cloud_cover_pct > 30.0:
        sensor = "ISRO Bhoonidhi EOS-04 SAR"
    else:
        sensor = "Copernicus Sentinel-2 NDWI"
        
    return current_area, area_delta_pct, sensor


def compute_water_level_rise_rate(
    precip_24h_mm: float,
    area_delta_pct: float,
) -> float:
    """
    Honest proxy rate of water level rise (m/hr) derived from 24h precipitation
    and surface area expansion slope.
    """
    # 24h precipitation / 24h = hourly influx, scaled by catchment concentration
    hourly_influx_m = (precip_24h_mm / 1000.0) / 24.0 * 8.0
    area_expansion_rate = max(0.0, area_delta_pct) * 0.02
    rate_m_per_hr = round(hourly_influx_m + area_expansion_rate, 2)
    return min(2.5, max(0.01, rate_m_per_hr))
