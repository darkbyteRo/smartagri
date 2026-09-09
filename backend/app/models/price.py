import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Boolean, BigInteger, Integer, ForeignKey, DateTime, Date, Enum
from sqlalchemy.sql import func
from app.database import Base

class SourceTypeEnum(str, enum.Enum):
    API = "API"
    FILE = "FILE"
    MANUAL = "MANUAL"
    DEMO = "DEMO"

class MarketPrice(Base):
    __tablename__ = "market_prices"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), index=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"), index=True)
    min_price: Mapped[float] = mapped_column(Float)
    max_price: Mapped[float] = mapped_column(Float)
    modal_price: Mapped[float] = mapped_column(Float)
    price_date: Mapped[Date] = mapped_column(Date)
    source: Mapped[str] = mapped_column(String, default="DEMO")
    arrival_qty: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

class TransportRate(Base):
    __tablename__ = "transport_rates"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    rate_per_km_per_ton: Mapped[float] = mapped_column(Float)
    vehicle_type: Mapped[str] = mapped_column(String)
    min_charge: Mapped[float] = mapped_column(Float, default=500.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class DataSource(Base):
    __tablename__ = "data_sources"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String)
    source_type: Mapped[SourceTypeEnum] = mapped_column(Enum(SourceTypeEnum))
    url: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_synced: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
