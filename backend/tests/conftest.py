import pytest
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

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Seed minimal test data
from passlib.context import CryptContext
from app.models import State, District, Market, MarketTypeEnum, Crop, TransportRate, User, Farmer, Buyer, RoleEnum

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = TestingSessionLocal()
try:
    ts = State(name="Telangana", code="TS")
    db.add(ts)
    db.commit()
    db.refresh(ts)

    dist = District(name="Sangareddy", state_id=ts.id, latitude=17.6147, longitude=78.0867)
    db.add(dist)
    db.commit()
    db.refresh(dist)

    market = Market(name="Bowenpally", district_id=dist.id, latitude=17.4718, longitude=78.4749, market_type=MarketTypeEnum.APMC, market_fee_percent=1.0, is_active=True)
    db.add(market)

    crop = Crop(name="Tomato", unit="kg", is_active=True, avg_shelf_life_days=7, spoilage_rate_per_day=3.0)
    db.add(crop)

    tr = TransportRate(rate_per_km_per_ton=4.0, vehicle_type="Standard", min_charge=500.0)
    db.add(tr)
    db.commit()

    # Users
    farmer_user = User(email="farmer@demo.com", password_hash=pwd_context.hash("demo1234"), full_name="Ramesh Kumar", role=RoleEnum.FARMER)
    buyer_user = User(email="buyer@demo.com", password_hash=pwd_context.hash("demo1234"), full_name="Srinivas Trading", role=RoleEnum.BUYER)
    admin_user = User(email="admin@demo.com", password_hash=pwd_context.hash("admin1234"), full_name="Admin User", role=RoleEnum.ADMIN)
    db.add_all([farmer_user, buyer_user, admin_user])
    db.commit()
    db.refresh(farmer_user)
    db.refresh(buyer_user)

    farmer = Farmer(user_id=farmer_user.id, district_id=dist.id, village="Sangareddy Village")
    buyer = Buyer(user_id=buyer_user.id, district_id=dist.id, business_name="Srinivas Trading", business_type="Wholesale", is_verified=True, reliability_score=85.0)
    db.add_all([farmer, buyer])
    db.commit()
finally:
    db.close()

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

