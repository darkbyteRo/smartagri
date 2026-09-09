from pydantic import BaseModel
from typing import Optional

class PricePredictionResponse(BaseModel):
    crop_id: int
    market_id: int
    prediction_date: str
    target_date: str
    predicted_price: float
    confidence: float
    error_margin: float
    model_version: str
    data_source: str
    warning: Optional[str] = None

class PredictionRangeResponse(BaseModel):
    crop_id: int
    crop_name: Optional[str] = None
    market_id: int
    market_name: Optional[str] = None
    predictions: list[PricePredictionResponse]
    data_disclaimer: str = "Predictions are estimates based on historical patterns. Not financial advice."

class TrainModelRequest(BaseModel):
    crop_id: int
    market_id: int

class TrainModelResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    metrics: Optional[dict] = None
    metadata: Optional[dict] = None
