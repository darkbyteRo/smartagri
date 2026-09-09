from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.user import RoleEnum

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: RoleEnum
    district_id: Optional[int] = None
    village: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: str
    role: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    phone: Optional[str] = None
    full_name: str
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class FarmerResponse(BaseModel):
    id: UUID
    user_id: UUID
    district_id: Optional[int] = None
    district_name: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    land_area_acres: Optional[float] = None
    user: UserResponse

    class Config:
        from_attributes = True

class BuyerResponse(BaseModel):
    id: UUID
    user_id: UUID
    district_id: Optional[int] = None
    business_name: str
    business_type: str
    is_verified: bool
    reliability_score: float
    completed_transactions: int
    cancelled_transactions: int
    user: UserResponse

    class Config:
        from_attributes = True
