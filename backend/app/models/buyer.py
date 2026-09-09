import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, ForeignKey, Integer, Boolean, DateTime, Date, Enum
from app.database import Base

class RequirementStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"

class Buyer(Base):
    __tablename__ = "buyers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"))
    business_name: Mapped[str] = mapped_column(String)
    business_type: Mapped[str] = mapped_column(String)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    reliability_score: Mapped[float] = mapped_column(Float, default=0.0)
    completed_transactions: Mapped[int] = mapped_column(Integer, default=0)
    cancelled_transactions: Mapped[int] = mapped_column(Integer, default=0)
    verified_at: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)

    user = relationship("User", back_populates="buyer")
    district = relationship("District")
    requirements = relationship("BuyerRequirement", back_populates="buyer")

class BuyerRequirement(Base):
    __tablename__ = "buyer_requirements"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("buyers.id"))
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"))
    quantity_kg_min: Mapped[float] = mapped_column(Float)
    quantity_kg_max: Mapped[float] = mapped_column(Float)
    quality_grade_min: Mapped[str] = mapped_column(String)
    max_price_per_kg: Mapped[float] = mapped_column(Float)
    preferred_district_id: Mapped[int | None] = mapped_column(ForeignKey("districts.id"), nullable=True)
    needed_by: Mapped[Date | None] = mapped_column(Date, nullable=True)
    status: Mapped[RequirementStatus] = mapped_column(Enum(RequirementStatus), default=RequirementStatus.ACTIVE)

    buyer = relationship("Buyer", back_populates="requirements")
    crop = relationship("Crop")
