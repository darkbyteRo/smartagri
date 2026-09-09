from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.models.market import MarketTypeEnum

class DistrictResponse(BaseModel):
    id: int
    name: str
    state_id: int
    latitude: float
    longitude: float

    model_config = ConfigDict(from_attributes=True)

class MarketBase(BaseModel):
    name: str
    name_telugu: Optional[str] = None
    district_id: int
    latitude: float
    longitude: float
    market_type: MarketTypeEnum
    market_fee_percent: float = 1.0

class MarketCreate(MarketBase):
    pass

class MarketResponse(MarketBase):
    id: int
    is_active: bool
    district_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
