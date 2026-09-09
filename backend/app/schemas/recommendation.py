from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class MarketComparisonRequest(BaseModel):
    crop_id: int
    quantity_kg: float
    farmer_latitude: float
    farmer_longitude: float
    quality_grade: str = "B"
    max_distance_km: float = 300.0

class MarketInfo(BaseModel):
    id: int
    name: str
    name_telugu: Optional[str] = None
    district_id: int
    district_name: Optional[str] = None
    latitude: float
    longitude: float
    market_type: str
    market_fee_percent: float

class PriceInfo(BaseModel):
    id: int
    modal_price: float
    min_price: float
    max_price: float
    price_date: str
    source: str
    arrival_qty: Optional[float] = None

class MarketComparisonResult(BaseModel):
    market: MarketInfo
    current_price: PriceInfo
    distance_km: float
    travel_time_hours: float
    transport_cost: float
    transport_cost_per_kg: float
    market_fee: float
    quality_grade: str
    quality_adjustment: float
    adjusted_price_per_kg: float
    gross_revenue: float
    net_realization: float
    net_per_kg: float
    demand_level: str
    rank: int
    explanation: str

class MarketComparisonResponse(BaseModel):
    crop_id: int
    crop_name: str
    quantity_kg: float
    quality_grade: str
    farmer_location: dict
    best_market: Optional[MarketComparisonResult] = None
    comparisons: list[MarketComparisonResult]
    total_markets_compared: int
    data_disclaimer: str = "Prices shown are from demo/simulated data unless otherwise indicated."
