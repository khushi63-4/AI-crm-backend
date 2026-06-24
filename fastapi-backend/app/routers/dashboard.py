from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from ..config import get_db
from ..models import Lead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    try:
        # Replicate the aggregate query from Express.js
        stats = db.query(
            func.count(Lead.id).label("totalLeads"),
            func.sum(case((Lead.lead_source == 'Manual', 1), else_=0)).label("manualLeads"),
            func.sum(case((Lead.lead_source == 'CSV Upload', 1), else_=0)).label("csvLeads"),
            func.sum(case((Lead.lead_source == 'Facebook Meta', 1), else_=0)).label("facebookLeads"),
            func.sum(case((Lead.call_output == 'Converted', 1), else_=0)).label("convertedLeads"),
            func.sum(case((Lead.call_output == 'Follow Up', 1), else_=0)).label("followUpLeads"),
            func.sum(case((Lead.call_output == 'Not Interested', 1), else_=0)).label("notInterestedLeads")
        ).first()

        # Handle None results if the DB is empty
        return {
            "totalLeads": stats.totalLeads or 0,
            "manualLeads": int(stats.manualLeads or 0),
            "csvLeads": int(stats.csvLeads or 0),
            "facebookLeads": int(stats.facebookLeads or 0),
            "convertedLeads": int(stats.convertedLeads or 0),
            "followUpLeads": int(stats.followUpLeads or 0),
            "notInterestedLeads": int(stats.notInterestedLeads or 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
