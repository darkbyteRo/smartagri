import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base

class TransactionStatus(str, enum.Enum):
    INITIATED = "INITIATED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"
    CANCELLED = "CANCELLED"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    offer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("buyer_offers.id"), unique=True)
    farmer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("farmers.id"), index=True)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("buyers.id"), index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"))
    quantity_kg: Mapped[float] = mapped_column(Float)
    agreed_price_per_kg: Mapped[float] = mapped_column(Float)
    total_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[TransactionStatus] = mapped_column(Enum(TransactionStatus), default=TransactionStatus.INITIATED)
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    offer = relationship("BuyerOffer")
    farmer = relationship("Farmer")
    buyer = relationship("Buyer")
    crop = relationship("Crop")
