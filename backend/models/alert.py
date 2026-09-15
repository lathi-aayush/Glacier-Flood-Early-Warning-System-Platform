from sqlalchemy import Column, String, Integer, JSON
from backend.db.database import Base

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    ts = Column(String, nullable=False)
    severity = Column(String, nullable=False, default="advisory")
    lake_name = Column(String, nullable=False, default="")
    lake_id = Column(String, nullable=False, default="", index=True)
    sms_count = Column(Integer, nullable=False, default=0)
    channels = Column(JSON, nullable=False, default=list)
    status = Column(String, nullable=False, default="ack")
