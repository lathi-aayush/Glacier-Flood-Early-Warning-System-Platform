from typing import List
from pydantic import BaseModel, Field, ConfigDict

class AlertResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    ts: str
    severity: str
    lakeName: str = Field(alias="lake_name")
    lakeId: str = Field(alias="lake_id")
    smsCount: int = Field(default=0, alias="sms_count")
    channels: List[str] = []
    status: str = "ack"
