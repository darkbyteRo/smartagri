from pydantic import BaseModel, ConfigDict
from typing import Optional, Union
from datetime import datetime
import uuid
from app.models.offer import OfferStatus

class OfferCreate(BaseModel):
    listing_id: uuid.UUID
    offered_price_per_kg: float
    quantity_kg: float
    message: Optional[str] = None

class OfferListingInfo(BaseModel):
    id: uuid.UUID
    crop_name: Optional[str] = ""
    quantity_kg: Optional[float] = 0
    quality_grade: Optional[str] = "B"
    farmer_name: Optional[str] = ""
    district_name: Optional[str] = ""
    expected_price_per_kg: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class OfferResponse(BaseModel):
    id: uuid.UUID
    buyer_id: uuid.UUID
    listing_id: uuid.UUID
    offered_price_per_kg: float
    quantity_kg: float
    message: Optional[str] = None
    status: OfferStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    buyer_name: Optional[str] = ""
    buyer_business_name: Optional[str] = ""
    buyer_verified: Optional[bool] = False
    buyer_reliability_score: Optional[float] = 0.0
    listing: Optional[OfferListingInfo] = None

    model_config = ConfigDict(from_attributes=True)

