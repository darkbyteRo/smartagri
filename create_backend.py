import os

base_dir = r'c:\Users\Rohan\Downloads\smartagri\backend'
dirs = [
    '', 'app', 'app/models', 'app/schemas', 'app/api', 'app/services',
    'app/ml', 'app/utils', 'alembic', 'tests'
]
for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

files = {}

files['requirements.txt'] = '''fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.13.0
psycopg2-binary==2.9.9
pydantic==2.5.2
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
httpx==0.25.2
scikit-learn==1.3.2
xgboost==2.0.3
pandas==2.1.4
numpy==1.26.2
python-dotenv==1.0.0
pytest==7.4.3
pytest-asyncio==0.23.2
aiofiles==23.2.1
'''

files['main.py'] = '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    yield
    logger.info("Shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# app.include_router(auth_router, prefix="/api/auth")
'''

files['app/__init__.py'] = ''

files['app/config.py'] = '''from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/smartagri"
    SECRET_KEY: str = "secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    SARVAM_API_KEY: str = ""
    MAPS_API_KEY: Optional[str] = None
    TRANSPORT_RATE_PER_KM_PER_TON: float = 4.0
    MARKET_FEE_PERCENT: float = 1.0
    DEMO_MODE: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
'''

files['app/database.py'] = '''from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'''

files['app/dependencies.py'] = '''from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db

def get_current_user(db: Session = Depends(get_db)):
    pass

def get_current_farmer(user = Depends(get_current_user)):
    pass

def get_current_buyer(user = Depends(get_current_user)):
    pass

def get_current_admin(user = Depends(get_current_user)):
    pass
'''

files['app/models/__init__.py'] = '''from app.models.user import User
from app.models.farmer import Farmer
from app.models.buyer import Buyer, BuyerRequirement
from app.models.crop import Crop
from app.models.market import State, District, Market
from app.models.price import MarketPrice, TransportRate, DataSource
from app.models.listing import ProduceListing
from app.models.offer import BuyerOffer
from app.models.transaction import Transaction
from app.models.prediction import PricePrediction, Recommendation, Notification, AuditLog
'''

files['app/models/user.py'] = '''import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Enum, DateTime
from sqlalchemy.sql import func
from app.database import Base
import enum

class RoleEnum(str, enum.Enum):
    FARMER = "FARMER"
    BUYER = "BUYER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    farmer = relationship("Farmer", back_populates="user", uselist=False)
    buyer = relationship("Buyer", back_populates="user", uselist=False)
'''

files['app/models/farmer.py'] = '''import uuid
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
'''

files['app/models/buyer.py'] = '''import uuid
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
'''

files['app/models/crop.py'] = '''from sqlalchemy.orm import Mapped, mapped_column
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
'''

files['app/models/market.py'] = '''import enum
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
'''

files['app/models/price.py'] = '''import enum
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
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
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
'''

files['app/models/listing.py'] = '''import uuid
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
'''

files['app/models/offer.py'] = '''import uuid
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
'''

files['app/models/transaction.py'] = '''import uuid
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
'''

files['app/models/prediction.py'] = '''import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Boolean, BigInteger, ForeignKey, DateTime, Date, Enum, Text, JSON
from sqlalchemy.sql import func
from app.database import Base

class RecommendationAction(str, enum.Enum):
    SELL = "SELL"
    HOLD = "HOLD"
    SELL_PARTIALLY = "SELL_PARTIALLY"

class PricePrediction(Base):
    __tablename__ = "price_predictions"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
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
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
'''

files['app/schemas/__init__.py'] = ''
files['app/api/__init__.py'] = ''
files['app/services/__init__.py'] = ''
files['app/ml/__init__.py'] = ''
files['app/utils/__init__.py'] = ''

files['app/utils/logging.py'] = '''import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
'''

files['alembic.ini'] = '''[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/smartagri

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
'''

files['alembic/env.py'] = '''import logging
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from app.config import settings
from app.database import Base
from app.models import *

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
'''

files['alembic/script.py.mako'] = '''"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = '${up_revision}'
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
'''

files['Dockerfile'] = '''FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
'''

files['tests/__init__.py'] = ''

files['tests/conftest.py'] = '''import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
'''

for rel_path, content in files.items():
    full_path = os.path.join(base_dir, rel_path)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('All backend files created successfully.')
