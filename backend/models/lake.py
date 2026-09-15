from sqlalchemy import Column, String, Float, Integer, JSON
from backend.db.database import Base

class LakeModel(Base):
    __tablename__ = "lakes"

    id = Column(String, primary_key=True, index=True)
    node_id = Column(String, nullable=False, default="")
    name = Column(String, nullable=False, index=True)
    basin = Column(String, nullable=False, default="")
    state = Column(String, nullable=False, default="")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False, default=0.0)
    tier = Column(String, nullable=False, default="safe")
    vulnerable_pop = Column(Integer, nullable=False, default=0)
    last_updated = Column(String, nullable=False, default="")
    watch_id = Column(String, nullable=False, default="")
    escalation_level = Column(Integer, nullable=False, default=0)
    sms_sent = Column(Integer, nullable=False, default=0)
    
    # Nested structured telemetry and predictions stored as JSON
    predictions = Column(JSON, nullable=False, default=dict)
    telemetry = Column(JSON, nullable=False, default=dict)
    shap = Column(JSON, nullable=False, default=list)
    flood_projection = Column(JSON, nullable=False, default=list)
    weather_data = Column(JSON, nullable=True, default=dict)
