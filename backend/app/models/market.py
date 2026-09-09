import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Boolean, Integer, ForeignKey, Enum
from app.database import Base

class MarketTypeEnum(str, enum.Enum):
    APMC = "APMC"
    PRIVATE = "PRIVATE"
    ENAM = "ENAM"

class State(Base):
    __tablename__ = "states"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    code: Mapped[str] = mapped_column(String, unique=True)
    districts = relationship("District", back_populates="state")

class District(Base):
    __tablename__ = "districts"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    state_id: Mapped[int] = mapped_column(ForeignKey("states.id"))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    
    state = relationship("State", back_populates="districts")
    markets = relationship("Market", back_populates="district")

class Market(Base):
    __tablename__ = "markets"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    name_telugu: Mapped[str | None] = mapped_column(String, nullable=True)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    market_type: Mapped[MarketTypeEnum] = mapped_column(Enum(MarketTypeEnum))
    market_fee_percent: Mapped[float] = mapped_column(Float, default=1.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    district = relationship("District", back_populates="markets")
