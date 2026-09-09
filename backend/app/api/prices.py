from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models.price import MarketPrice
from app.models.crop import Crop
from app.models.market import Market
from app.schemas.price import MarketPriceCreate, MarketPriceResponse

router = APIRouter(prefix="/api/prices", tags=["prices"])

@router.get("/latest", response_model=List[MarketPriceResponse])
def get_all_latest_prices(db: Session = Depends(get_db)):
    subquery = db.query(
        MarketPrice.crop_id,
        MarketPrice.market_id,
        func.max(MarketPrice.price_date).label('max_date')
    ).group_by(MarketPrice.crop_id, MarketPrice.market_id).subquery()

    query = db.query(MarketPrice, Crop.name.label("crop_name"), Market.name.label("market_name"))\
        .join(subquery, (MarketPrice.crop_id == subquery.c.crop_id) & (MarketPrice.market_id == subquery.c.market_id) & (MarketPrice.price_date == subquery.c.max_date))\
        .join(Crop, MarketPrice.crop_id == Crop.id)\
        .join(Market, MarketPrice.market_id == Market.id)\
        .order_by(Crop.name.asc(), Market.name.asc())

    results = query.all()
    response = []
    for price, c_name, m_name in results:
        p_dict = price.__dict__.copy()
        p_dict["crop_name"] = c_name
        p_dict["market_name"] = m_name
        response.append(p_dict)
    return response

@router.get("/current/{crop_id}", response_model=List[MarketPriceResponse])
def get_current_prices(crop_id: int, db: Session = Depends(get_db)):
    subquery = db.query(
        MarketPrice.market_id,
        func.max(MarketPrice.price_date).label('max_date')
    ).filter(MarketPrice.crop_id == crop_id).group_by(MarketPrice.market_id).subquery()

    query = db.query(MarketPrice, Crop.name.label("crop_name"), Market.name.label("market_name"))\
        .join(subquery, (MarketPrice.market_id == subquery.c.market_id) & (MarketPrice.price_date == subquery.c.max_date))\
        .join(Crop, MarketPrice.crop_id == Crop.id)\
        .join(Market, MarketPrice.market_id == Market.id)\
        .filter(MarketPrice.crop_id == crop_id)

    results = query.all()
    response = []
    for price, c_name, m_name in results:
        p_dict = price.__dict__.copy()
        p_dict["crop_name"] = c_name
        p_dict["market_name"] = m_name
        response.append(p_dict)
    
    return response

@router.get("/history/{crop_id}/{market_id}", response_model=List[MarketPriceResponse])
def get_price_history(crop_id: int, market_id: int, days: int = 30, db: Session = Depends(get_db)):
    cutoff_date = date.today() - timedelta(days=days)
    query = db.query(MarketPrice, Crop.name.label("crop_name"), Market.name.label("market_name"))\
        .join(Crop, MarketPrice.crop_id == Crop.id)\
        .join(Market, MarketPrice.market_id == Market.id)\
        .filter(
            MarketPrice.crop_id == crop_id,
            MarketPrice.market_id == market_id,
            MarketPrice.price_date >= cutoff_date
        ).order_by(MarketPrice.price_date.asc())
        
    results = query.all()
    response = []
    for price, c_name, m_name in results:
        p_dict = price.__dict__.copy()
        p_dict["crop_name"] = c_name
        p_dict["market_name"] = m_name
        response.append(p_dict)
    return response

@router.post("/", response_model=MarketPriceResponse)
def create_price(price: MarketPriceCreate, db: Session = Depends(get_db)):
    db_price = MarketPrice(**price.model_dump())
    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price


@router.post("/sync")
def sync_prices(api_key: str = None, db: Session = Depends(get_db)):
    from app.services.live_price_sync import sync_live_mandi_prices
    return sync_live_mandi_prices(db, api_key=api_key)
