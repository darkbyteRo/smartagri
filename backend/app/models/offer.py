import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base

class OfferStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"
    EXPIRED = "EXPIRED"

class BuyerOffer(Base):
    __tablename__ = "buyer_offers"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("buyers.id"), index=True)
    listing_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("produce_listings.id"), index=True)
    offered_price_per_kg: Mapped[float] = mapped_column(Float)
    quantity_kg: Mapped[float] = mapped_column(Float)
    message: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[OfferStatus] = mapped_column(Enum(OfferStatus), default=OfferStatus.PENDING)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    
    buyer = relationship("Buyer")
    listing = relationship("ProduceListing", back_populates="offers")
