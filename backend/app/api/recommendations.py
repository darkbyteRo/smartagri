from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.market_intelligence import MarketIntelligenceEngine
from app.schemas.recommendation import MarketComparisonRequest, MarketComparisonResponse
from app.models.crop import Crop
from typing import List

router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])

@router.post("/compare", response_model=MarketComparisonResponse)
def compare_markets(request: MarketComparisonRequest, db: Session = Depends(get_db)):
    engine = MarketIntelligenceEngine(db)
    
    crop = db.query(Crop).filter(Crop.id == request.crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop {request.crop_id} not found")
        
    try:
        comparisons = engine.compare_markets(
            crop_id=request.crop_id,
            quantity_kg=request.quantity_kg,
            farmer_lat=request.farmer_latitude,
            farmer_lon=request.farmer_longitude,
            quality_grade=request.quality_grade,
            max_distance_km=request.max_distance_km
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    best_market = comparisons[0] if comparisons else None
    
    return MarketComparisonResponse(
        crop_id=crop.id,
        crop_name=crop.name,
        quantity_kg=request.quantity_kg,
        quality_grade=request.quality_grade,
        farmer_location={"latitude": request.farmer_latitude, "longitude": request.farmer_longitude},
        best_market=best_market,
        comparisons=comparisons,
        total_markets_compared=len(comparisons)
    )

@router.get("/prices/{crop_id}", response_model=List[dict])
def get_crop_prices(crop_id: int, db: Session = Depends(get_db)):
    engine = MarketIntelligenceEngine(db)
    
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop {crop_id} not found")
        
    from app.models.market import Market
    markets = db.query(Market).filter(Market.is_active == True).all()
    
    results = []
    for market in markets:
        price = engine.get_current_price(crop_id, market.id)
        if price:
            results.append({
                "market_id": market.id,
                "market_name": market.name,
                "price": {
                    "id": price.id,
                    "modal_price": price.modal_price,
                    "min_price": price.min_price,
                    "max_price": price.max_price,
                    "price_date": str(price.price_date),
                    "source": price.source,
                    "arrival_qty": price.arrival_qty
                }
            })
            
    return results
