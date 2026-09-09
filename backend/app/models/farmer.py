import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, ForeignKey
from app.database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"))
    village: Mapped[str | None] = mapped_column(String, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    land_area_acres: Mapped[float | None] = mapped_column(Float, nullable=True)

    user = relationship("User", back_populates="farmer")
    district = relationship("District")
    listings = relationship("ProduceListing", back_populates="farmer")
