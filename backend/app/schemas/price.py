from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class MarketPriceBase(BaseModel):
    crop_id: int
    market_id: int
    min_price: float
    max_price: float
    modal_price: float
    price_date: date
    source: str = 'DEMO'
    arrival_qty: Optional[float] = None

class MarketPriceCreate(MarketPriceBase):
    pass

class MarketPriceResponse(MarketPriceBase):
    id: int
    crop_name: Optional[str] = None
    market_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PriceHistoryRequest(BaseModel):
    crop_id: int
    market_id: int
    days: int = 30
