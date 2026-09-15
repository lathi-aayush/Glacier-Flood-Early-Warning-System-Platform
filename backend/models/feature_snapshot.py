from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey
from backend.db.database import Base

class FeatureSnapshotModel(Base):
    __tablename__ = "feature_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    lake_id = Column(String, index=True, nullable=False)
    timestamp = Column(String, index=True, nullable=False)  # ISO UTC
    
    # Weather metrics (Open-Meteo)
    precip_24h_mm = Column(Float, nullable=False, default=0.0)
    precip_7d_mm = Column(Float, nullable=False, default=0.0)
    temp_c = Column(Float, nullable=False, default=0.0)
    freezing_level_m = Column(Float, nullable=False, default=0.0)
    
    # Seismic metrics (USGS)
    seismic_max_mag = Column(Float, nullable=False, default=0.0)
    seismic_count_7d = Column(Integer, nullable=False, default=0)
    
    # Optical / Radar water indicators (Sentinel-2 CDSE / Bhoonidhi SAR)
    water_area_km2 = Column(Float, nullable=False, default=0.0)
    area_delta_pct = Column(Float, nullable=False, default=0.0)
    cloud_cover_pct = Column(Float, nullable=True)
    satellite_scene = Column(String, nullable=True)
    source = Column(String, nullable=False, default="multi_source")
    
    # Full JSON telemetry snapshot for flexibility
    raw_metadata = Column(JSON, nullable=True, default=dict)
