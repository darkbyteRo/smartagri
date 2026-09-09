from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid
from app.models.transaction import TransactionStatus

class TransactionResponse(BaseModel):
    id: uuid.UUID
    offer_id: uuid.UUID
    farmer_id: uuid.UUID
    buyer_id: uuid.UUID
    crop_id: int
    quantity_kg: float
    agreed_price_per_kg: float
    total_amount: float
    status: TransactionStatus
    completed_at: Optional[datetime]
    created_at: datetime
    crop_name: str
    buyer_name: str
    farmer_name: str

    model_config = ConfigDict(from_attributes=True)
