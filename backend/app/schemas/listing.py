from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime
import uuid
from app.models.listing import ListingStatus

class ListingCreate(BaseModel):
    crop_id: int
    quantity_kg: float
    quality_grade: str = 'B'
    expected_price_per_kg: Optional[float] = None
    harvest_date: date
    available_from: Optional[date] = None
    available_until: Optional[date] = None

    @field_validator('available_from', 'harvest_date', 'available_until', mode='before')
    @classmethod
    def parse_dates(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            if 'T' in v:
                v = v.split('T')[0]
            try:
                return datetime.strptime(v, '%Y-%m-%d').date()
            except Exception:
                pass
        if isinstance(v, datetime):
            return v.date()
        return v

class ListingUpdate(BaseModel):
    quantity_kg: Optional[float] = None
    quality_grade: Optional[str] = None
    expected_price_per_kg: Optional[float] = None
    available_until: Optional[date] = None
    status: Optional[ListingStatus] = None

class ListingResponse(BaseModel):
    id: uuid.UUID
    farmer_id: uuid.UUID
    crop_id: int
    quantity_kg: float
    quality_grade: str
    expected_price_per_kg: Optional[float]
    harvest_date: date
    available_from: date
    available_until: Optional[date]
    status: ListingStatus
    created_at: datetime
    updated_at: datetime
    crop_name: str
    farmer_name: str
    district_name: str

    model_config = ConfigDict(from_attributes=True)
