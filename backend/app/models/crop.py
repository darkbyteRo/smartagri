from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Boolean, Integer
from app.database import Base

class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    name_telugu: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    unit: Mapped[str] = mapped_column(String, default='kg')
    avg_shelf_life_days: Mapped[float | None] = mapped_column(Float, nullable=True)
    spoilage_rate_per_day: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
