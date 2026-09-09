from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from app.database import get_db
from app.models.market import Market, District
from app.models.price import MarketPrice
from app.models.crop import Crop
from app.schemas.market import MarketCreate, MarketResponse, DistrictResponse
from app.schemas.price import MarketPriceResponse

router = APIRouter(prefix="/api/markets", tags=["markets"])

@router.get("/districts", response_model=List[DistrictResponse])
def get_districts(db: Session = Depends(get_db)):
    return db.query(District).all()

@router.get("/", response_model=List[MarketResponse])
def get_markets(district_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Market)
    if district_id:
        query = query.filter(Market.district_id == district_id)
    markets = query.all()
    
    result = []
    for m in markets:
        m_dict = m.__dict__.copy()
        m_dict["district_name"] = m.district.name if m.district else None
        result.append(m_dict)
    return result

@router.get("/{market_id}", response_model=MarketResponse)
def get_market(market_id: int, db: Session = Depends(get_db)):
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    m_dict = market.__dict__.copy()
    m_dict["district_name"] = market.district.name if market.district else None
    return m_dict

@router.get("/{market_id}/prices", response_model=List[MarketPriceResponse])
def get_market_prices(market_id: int, crop_id: Optional[int] = None, days: int = Query(7, ge=1, le=90), db: Session = Depends(get_db)):
    cutoff_date = date.today() - timedelta(days=days)
    
    query = db.query(MarketPrice, Crop.name.label("crop_name"), Market.name.label("market_name"))\
        .join(Crop, MarketPrice.crop_id == Crop.id)\
        .join(Market, MarketPrice.market_id == Market.id)\
        .filter(
            MarketPrice.market_id == market_id,
            MarketPrice.price_date >= cutoff_date
        )
        
    if crop_id:
        query = query.filter(MarketPrice.crop_id == crop_id)
        
    results = query.order_by(MarketPrice.price_date.desc()).all()
    
    response = []
    for price, c_name, m_name in results:
        p_dict = price.__dict__.copy()
        p_dict["crop_name"] = c_name
        p_dict["market_name"] = m_name
        response.append(p_dict)
        
    return response
