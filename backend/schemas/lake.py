from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class PredictionsSchema(BaseModel):
    h72: float = 0.0
    h24: float = 0.0
    h6: float = 0.0

class TelemetrySchema(BaseModel):
    waterLevelMPerHr: float = 0.0
    seismicMag: float = 0.0
    areaDeltaPct: float = 0.0

class ShapItemSchema(BaseModel):
    feature: str
    value: float
    direction: str  # 'up' | 'down'

class FloodProjectionItemSchema(BaseModel):
    timeBand: str
    village: str
    popAtRisk: int
    urgency: str  # 'critical' | 'elevated' | 'watch'

class LakeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    nodeId: str = Field(alias="node_id")
    name: str
    basin: str
    state: str
    lat: float
    lng: float
    riskScore: float = Field(alias="risk_score")
    tier: str
    vulnerablePop: int = Field(alias="vulnerable_pop")
    lastUpdated: str = Field(alias="last_updated")
    watchId: str = Field(alias="watch_id")
    predictions: PredictionsSchema
    telemetry: TelemetrySchema
    shap: List[ShapItemSchema] = []
    floodProjection: List[FloodProjectionItemSchema] = Field(default=[], alias="flood_projection")
    escalationLevel: int = Field(default=0, alias="escalation_level")
    smsSent: int = Field(default=0, alias="sms_sent")
    weatherData: Optional[Dict[str, Any]] = Field(default=None, alias="weather_data")

class LakeSyncResponse(BaseModel):
    status: str
    lake_id: str
    weather_summary: Dict[str, Any]
    new_risk_score: float
    new_tier: str
