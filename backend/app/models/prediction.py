import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Boolean, BigInteger, Integer, ForeignKey, DateTime, Date, Enum, Text, JSON
from sqlalchemy.sql import func
from app.database import Base

class RecommendationAction(str, enum.Enum):
    SELL = "SELL"
    HOLD = "HOLD"
    SELL_PARTIALLY = "SELL_PARTIALLY"

class PricePrediction(Base):
    __tablename__ = "price_predictions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), index=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"), index=True)
    prediction_date: Mapped[Date] = mapped_column(Date)
    target_date: Mapped[Date] = mapped_column(Date)
    predicted_price: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    error_margin: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String)
    data_source: Mapped[str] = mapped_column(String)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farmers.id"), index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"))
    quantity_kg: Mapped[float] = mapped_column(Float)
    recommendation: Mapped[RecommendationAction] = mapped_column(Enum(RecommendationAction))
    current_best_price: Mapped[float] = mapped_column(Float)
    predicted_future_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    expected_benefit: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str] = mapped_column(String)
    confidence: Mapped[float] = mapped_column(Float)
    explanation: Mapped[str] = mapped_column(Text)
    market_comparison: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    notification_type: Mapped[str] = mapped_column(String)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
