import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, RoleEnum
from app.models.farmer import Farmer
from app.models.buyer import Buyer
from app.auth.schemas import UserRegister
from app.auth.utils import hash_password, verify_password

def register_user(db: Session, user_data: UserRegister) -> User:
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
    hashed_pwd = hash_password(user_data.password)
    
    new_user = User(
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hashed_pwd,
        full_name=user_data.full_name,
        role=user_data.role
    )
    db.add(new_user)
    db.flush()
    
    if user_data.role == RoleEnum.FARMER:
        if user_data.district_id is not None:
            new_farmer = Farmer(
                user_id=new_user.id,
                district_id=user_data.district_id,
                village=user_data.village
            )
            db.add(new_farmer)
    elif user_data.role == RoleEnum.BUYER:
        b_name = user_data.business_name.strip() if user_data.business_name and user_data.business_name.strip() else f"{user_data.full_name}'s Trading"
        b_type = user_data.business_type.strip() if user_data.business_type and user_data.business_type.strip() else "Wholesale Trader"
        d_id = user_data.district_id if user_data.district_id is not None else 4
        new_buyer = Buyer(
            user_id=new_user.id,
            district_id=d_id,
            business_name=b_name,
            business_type=b_type,
            is_verified=True,
            reliability_score=85.0
        )
        db.add(new_buyer)
        
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def _to_uuid(val):
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return val

def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == _to_uuid(user_id)).first()

def get_farmer_profile(db: Session, user_id: str) -> Farmer | None:
    return db.query(Farmer).filter(Farmer.user_id == _to_uuid(user_id)).first()

def get_buyer_profile(db: Session, user_id: str) -> Buyer | None:
    return db.query(Buyer).filter(Buyer.user_id == _to_uuid(user_id)).first()

