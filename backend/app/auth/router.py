from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
import json

from app.database import get_db
from app.auth import schemas, service, utils
from app.config import settings
from app.dependencies import get_current_user
from app.models.user import User, RoleEnum

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=dict)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    user = service.register_user(db, user_data)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"user_id": str(user.id), "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    user_resp = schemas.UserResponse.model_validate(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp
    }

@router.post("/login", response_model=dict)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        email = form.get("username")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            email = body.get("email")
            password = body.get("password")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
            
    user = service.authenticate_user(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"user_id": str(user.id), "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    user_resp = schemas.UserResponse.model_validate(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == RoleEnum.FARMER:
        farmer = service.get_farmer_profile(db, str(current_user.id))
        if farmer:
            return schemas.FarmerResponse.model_validate(farmer)
    elif current_user.role == RoleEnum.BUYER:
        buyer = service.get_buyer_profile(db, str(current_user.id))
        if buyer:
            return schemas.BuyerResponse.model_validate(buyer)
            
    return schemas.UserResponse.model_validate(current_user)
