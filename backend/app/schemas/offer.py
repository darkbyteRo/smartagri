from pydantic import BaseModel, ConfigDict
from typing import Optional, Union
from datetime import datetime
import uuid
from app.models.offer import OfferStatus
from app.schemas.listing import ListingResponse

class OfferCreate(BaseModel):
    listing_id: uuid.UUID
    offered_price_per_kg: float
    quantity_kg: float
    message: Optional[str] = None

class OfferResponse(BaseModel):
    id: uuid.UUID
    buyer_id: uuid.UUID
    listing_id: uuid.UUID
    offered_price_per_kg: float
    quantity_kg: float
    message: Optional[str]
    status: OfferStatus
    created_at: datetime
    updated_at: datetime
    buyer_name: str
    buyer_business_name: str
    buyer_verified: bool
    buyer_reliability_score: float
    listing: ListingResponse

    model_config = ConfigDict(from_attributes=True)
