from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict
from datetime import date
import uuid
from app.models.buyer import RequirementStatus

class BuyerRequirementCreate(BaseModel):
    crop_id: int
    quantity_kg_min: float
    quantity_kg_max: float
    quality_grade_min: Optional[str] = None
    max_price_per_kg: Optional[float] = None
    preferred_district_id: Optional[int] = None
    needed_by: Optional[date] = None

class BuyerRequirementResponse(BaseModel):
    id: uuid.UUID
    buyer_id: uuid.UUID
    crop_id: int
    quantity_kg_min: float
    quantity_kg_max: float
    quality_grade_min: Optional[str]
    max_price_per_kg: Optional[float]
    preferred_district_id: Optional[int]
    needed_by: Optional[date]
    status: RequirementStatus
    crop_name: str

    model_config = ConfigDict(from_attributes=True)

class BuyerMatchResult(BaseModel):
    buyer_id: uuid.UUID
    buyer_business_name: str
    buyer_verified: bool
    buyer_reliability_score: float
    match_score: float
    score_breakdown: Dict[str, float]
