from pydantic import BaseModel, ConfigDict
from typing import Optional

class CropBase(BaseModel):
    name: str
    name_telugu: Optional[str] = None
    category: Optional[str] = None
    unit: str = 'kg'
    avg_shelf_life_days: Optional[float] = None
    spoilage_rate_per_day: Optional[float] = None

class CropCreate(CropBase):
    pass

class CropResponse(CropBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
