import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, ForeignKey, Date, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base

class ListingStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SOLD = "SOLD"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class ProduceListing(Base):
    __tablename__ = "produce_listings"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farmers.id"), index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), index=True)
    quantity_kg: Mapped[float] = mapped_column(Float)
    quality_grade: Mapped[str] = mapped_column(String, default="B")
    expected_price_per_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    harvest_date: Mapped[Date] = mapped_column(Date)
    available_from: Mapped[Date] = mapped_column(Date)
    available_until: Mapped[Date | None] = mapped_column(Date, nullable=True)
    status: Mapped[ListingStatus] = mapped_column(Enum(ListingStatus), default=ListingStatus.ACTIVE)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    
    farmer = relationship("Farmer", back_populates="listings")
    crop = relationship("Crop")
    offers = relationship("BuyerOffer", back_populates="listing")
