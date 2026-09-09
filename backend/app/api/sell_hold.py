from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.sell_hold_engine import SellHoldEngine

router = APIRouter(prefix="/api/recommendations", tags=["sell-hold"])

class SellHoldRequest(BaseModel):
    crop_id: int
    quantity_kg: float
    farmer_latitude: float
    farmer_longitude: float
    quality_grade: str = "B"
    harvest_date: Optional[date] = None

@router.post("/sell-hold")
def get_sell_hold_recommendation(request: SellHoldRequest, db: Session = Depends(get_db)):
    engine = SellHoldEngine(db)
    
    try:
        recommendation = engine.recommend(
            crop_id=request.crop_id,
            quantity_kg=request.quantity_kg,
            farmer_lat=request.farmer_latitude,
            farmer_lon=request.farmer_longitude,
            quality_grade=request.quality_grade,
            harvest_date=request.harvest_date
        )
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
