from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.services.price_prediction import PricePredictionService
from app.schemas.prediction import (
    PricePredictionResponse,
    PredictionRangeResponse,
    TrainModelRequest,
    TrainModelResponse
)
from app.models.crop import Crop
from app.models.market import Market

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

@router.get("/{crop_id}/{market_id}", response_model=PredictionRangeResponse)
def get_predictions(
    crop_id: int, 
    market_id: int, 
    days: int = Query(7, ge=1, le=7), 
    db: Session = Depends(get_db)
):
    # Verify crop and market exist
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
        
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
        
    service = PricePredictionService(db)
    predictions = service.get_predictions(crop_id, market_id, days)
    
    return PredictionRangeResponse(
        crop_id=crop_id,
        crop_name=crop.name,
        market_id=market_id,
        market_name=market.name,
        predictions=predictions
    )

@router.post("/train", response_model=TrainModelResponse)
def train_model(
    request: TrainModelRequest,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    service = PricePredictionService(db)
    result = service.train(request.crop_id, request.market_id)
    return TrainModelResponse(**result)

@router.post("/train-all")
def train_all_models(
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    service = PricePredictionService(db)
    results = service.train_all()
    return {"success": True, "trained_models_count": len(results), "results": results}
