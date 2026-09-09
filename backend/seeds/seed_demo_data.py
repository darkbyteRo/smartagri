import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
import random
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import (
    State, District, Market, Crop, MarketPrice, TransportRate,
    DataSource, User, Farmer, Buyer, BuyerRequirement, RoleEnum, SourceTypeEnum
)
from app.models.market import MarketTypeEnum
from app.models.buyer import RequirementStatus
from seeds.telangana_districts import TELANGANA_DISTRICTS
from seeds.telangana_markets import TELANGANA_MARKETS
from seeds.crop_data import INITIAL_CROPS
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def get_base_price(crop_name: str) -> float:
    if crop_name == "Tomato":
        return 20.0
    elif crop_name == "Onion":
        return 30.0
    elif crop_name == "Paddy":
        return 22.0
    elif crop_name == "Maize":
        return 18.0
    elif crop_name == "Cotton":
        return 65.0
    return 30.0

def get_volatility(crop_name: str) -> float:
    if crop_name == "Tomato":
        return 0.15
    elif crop_name == "Onion":
        return 0.10
    elif crop_name == "Paddy":
        return 0.02
    elif crop_name == "Maize":
        return 0.05
    elif crop_name == "Cotton":
        return 0.08
    return 0.05

def main():
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    
    db: Session = SessionLocal()
    
    try:
        print("Creating State...")
        ts = State(name="Telangana", code="TS")
        db.add(ts)
        db.commit()
        db.refresh(ts)
        
        print("Creating Districts...")
        district_objs = {}
        for d in TELANGANA_DISTRICTS:
            dist = District(
                name=d["name"],
                state_id=ts.id,
                latitude=d["latitude"],
                longitude=d["longitude"]
            )
            db.add(dist)
            db.commit()
            db.refresh(dist)
            district_objs[dist.name] = dist
            
        print("Creating Markets...")
        market_objs = []
        for m in TELANGANA_MARKETS:
            dist_id = district_objs[m["district"]].id
            market = Market(
                name=m["name"],
                name_telugu=m.get("name_telugu"),
                district_id=dist_id,
                latitude=m["latitude"],
                longitude=m["longitude"],
                market_type=MarketTypeEnum(m["market_type"]),
                market_fee_percent=m["market_fee_percent"],
                is_active=True
            )
            db.add(market)
            market_objs.append(market)
        db.commit()
        
        print("Creating Crops...")
        crop_objs = []
        for c in INITIAL_CROPS:
            crop = Crop(**c)
            db.add(crop)
            crop_objs.append(crop)
        db.commit()
        
        print("Creating Transport Rates...")
        tr1 = TransportRate(rate_per_km_per_ton=4.0, vehicle_type="Standard", min_charge=500.0)
        tr2 = TransportRate(rate_per_km_per_ton=6.0, vehicle_type="Refrigerated", min_charge=800.0)
        db.add_all([tr1, tr2])
        db.commit()
        
        print("Creating Data Source...")
        ds = DataSource(name="Demo Data Generator", source_type=SourceTypeEnum.DEMO, is_active=True)
        db.add(ds)
        db.commit()
        
        print("Generating Market Prices (90 days)...")
        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        
        for crop in crop_objs:
            base_price = get_base_price(crop.name)
            volatility = get_volatility(crop.name)
            
            for market in market_objs:
                current_date = start_date
                current_price = base_price
                
                while current_date <= end_date:
                    # Random walk
                    change_pct = random.uniform(-volatility, volatility)
                    current_price = current_price * (1 + change_pct)
                    
                    # Add seasonality/cyclicality based on day of week (weekends slightly higher)
                    if current_date.weekday() >= 5:
                        current_price *= 1.02
                        
                    modal = round(current_price, 2)
                    min_p = round(modal * 0.85, 2)
                    max_p = round(modal * 1.15, 2)
                    
                    qty = round(random.uniform(50, 500), 2)
                    
                    mp = MarketPrice(
                        crop_id=crop.id,
                        market_id=market.id,
                        min_price=min_p,
                        max_price=max_p,
                        modal_price=modal,
                        price_date=current_date,
                        source="DEMO",
                        arrival_qty=qty
                    )
                    db.add(mp)
                    current_date += timedelta(days=1)
                    
        db.commit()
        
        print("Creating Demo Users (Farmers & Buyers)...")
        users = [
            {"email": "admin@demo.com", "phone": "0000000000", "pw": "admin1234", "name": "Admin User", "role": RoleEnum.ADMIN},
            {"email": "farmer@demo.com", "phone": "1111111111", "pw": "demo1234", "name": "Ramesh Kumar", "role": RoleEnum.FARMER, "dist": "Sangareddy"},
            {"email": "farmer2@demo.com", "phone": "2222222222", "pw": "demo1234", "name": "Lakshmi Devi", "role": RoleEnum.FARMER, "dist": "Hanumakonda"},
            {"email": "farmer3@demo.com", "phone": "3333333333", "pw": "demo1234", "name": "Venkat Reddy", "role": RoleEnum.FARMER, "dist": "Karimnagar"},
            {"email": "buyer@demo.com", "phone": "4444444444", "pw": "demo1234", "name": "Srinivas Trading", "role": RoleEnum.BUYER, "dist": "Hyderabad", "b_type": "Wholesale Trader", "verif": True},
            {"email": "buyer2@demo.com", "phone": "5555555555", "pw": "demo1234", "name": "Fresh Mart Retail", "role": RoleEnum.BUYER, "dist": "Rangareddy", "b_type": "Retail Chain", "verif": True},
            {"email": "buyer3@demo.com", "phone": "6666666666", "pw": "demo1234", "name": "Kavya Exports", "role": RoleEnum.BUYER, "dist": "Nizamabad", "b_type": "Exporter", "verif": False},
        ]
        
        buyer_objs = []
        for u in users:
            user = User(
                email=u["email"],
                phone=u["phone"],
                password_hash=pwd_context.hash(u["pw"]),
                full_name=u["name"],
                role=u["role"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            if u["role"] == RoleEnum.FARMER:
                dist_id = district_objs[u["dist"]].id
                farmer = Farmer(user_id=user.id, district_id=dist_id, village="Demo Village", land_area_acres=random.uniform(2.0, 10.0))
                db.add(farmer)
                
            elif u["role"] == RoleEnum.BUYER:
                dist_id = district_objs[u["dist"]].id
                buyer = Buyer(
                    user_id=user.id,
                    district_id=dist_id,
                    business_name=u["name"],
                    business_type=u["b_type"],
                    is_verified=u["verif"]
                )
                db.add(buyer)
                db.commit()
                db.refresh(buyer)
                buyer_objs.append(buyer)
                
        db.commit()
        
        print("Creating Buyer Requirements...")
        if buyer_objs and crop_objs:
            req = BuyerRequirement(
                buyer_id=buyer_objs[0].id,
                crop_id=crop_objs[0].id,
                quantity_kg_min=100.0,
                quantity_kg_max=500.0,
                quality_grade_min="Grade A",
                max_price_per_kg=get_base_price(crop_objs[0].name) * 1.2,
                status=RequirementStatus.ACTIVE
            )
            db.add(req)
            db.commit()

        print("Seeding Complete!")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
