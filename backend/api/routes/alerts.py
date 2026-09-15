from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.models.alert import AlertModel

router = APIRouter()

def serialize_alert(alert: AlertModel) -> Dict[str, Any]:
    return {
        "id": alert.id,
        "ts": alert.ts,
        "severity": alert.severity,
        "lakeName": alert.lake_name,
        "lake_name": alert.lake_name,
        "lakeId": alert.lake_id,
        "lake_id": alert.lake_id,
        "smsCount": alert.sms_count,
        "sms_count": alert.sms_count,
        "channels": alert.channels or [],
        "status": alert.status,
    }

@router.get("/alerts", response_model=List[Dict[str, Any]])
def list_alerts(db: Session = Depends(get_db)):
    """Returns all early warning alert logs."""
    alerts = db.query(AlertModel).order_by(AlertModel.ts.desc()).all()
    return [serialize_alert(a) for a in alerts]

@router.post("/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    """Marks an alert as acknowledged."""
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    alert.status = "ack"
    db.commit()
    db.refresh(alert)
    return serialize_alert(alert)
