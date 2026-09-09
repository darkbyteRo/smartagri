from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.orm import aliased
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import (
    User, Farmer, Buyer, Market, MarketPrice, ProduceListing, Transaction, Crop
)
from app.models.listing import ListingStatus
from app.models.transaction import TransactionStatus

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/farmers")
def list_farmers(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    results = db.query(Farmer, User).join(User, Farmer.user_id == User.id).all()
    farmers = []
    for f, u in results:
        farmers.append({
            "id": f.id,
            "user_id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "district_id": f.district_id,
            "village": f.village,
            "land_area_acres": f.land_area_acres,
            "is_active": u.is_active,
            "created_at": u.created_at
        })
    return farmers

@router.get("/buyers")
def list_buyers(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    results = db.query(Buyer, User).join(User, Buyer.user_id == User.id).all()
    buyers = []
    for b, u in results:
        buyers.append({
            "id": b.id,
            "user_id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "business_name": b.business_name,
            "business_type": b.business_type,
            "is_verified": b.is_verified,
            "verified_at": b.verified_at,
            "is_active": u.is_active,
            "created_at": u.created_at
        })
    return buyers

@router.put("/buyers/{buyer_id}/verify")
def verify_buyer(buyer_id: uuid.UUID, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    buyer.is_verified = True
    buyer.verified_at = datetime.utcnow()
    db.commit()
    return {"message": "Buyer verified successfully", "buyer_id": buyer.id}

@router.get("/markets")
def list_markets(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(Market).all()

@router.get("/prices")
def list_prices(
    crop_id: Optional[int] = None, 
    market_id: Optional[int] = None, 
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    query = db.query(MarketPrice, Crop.name.label("crop_name"), Market.name.label("market_name"))\
        .join(Crop, MarketPrice.crop_id == Crop.id)\
        .join(Market, MarketPrice.market_id == Market.id)
        
    if crop_id:
        query = query.filter(MarketPrice.crop_id == crop_id)
    if market_id:
        query = query.filter(MarketPrice.market_id == market_id)
        
    results = query.order_by(MarketPrice.price_date.desc()).limit(limit).all()
    prices = []
    for p, c_name, m_name in results:
        p_dict = p.__dict__.copy()
        p_dict.pop("_sa_instance_state", None)
        p_dict["crop_name"] = c_name
        p_dict["market_name"] = m_name
        prices.append(p_dict)
    return prices

@router.get("/listings")
def list_listings(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    results = db.query(ProduceListing, Crop.name.label("crop_name"), User.full_name.label("farmer_name"))\
        .join(Crop, ProduceListing.crop_id == Crop.id)\
        .join(Farmer, ProduceListing.farmer_id == Farmer.id)\
        .join(User, Farmer.user_id == User.id).all()
        
    listings = []
    for l, c_name, f_name in results:
        l_dict = l.__dict__.copy()
        l_dict.pop("_sa_instance_state", None)
        l_dict["crop_name"] = c_name
        l_dict["farmer_name"] = f_name
        listings.append(l_dict)
    return listings

@router.get("/transactions")
def list_transactions(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    FarmerUser = aliased(User)
    BuyerUser = aliased(User)
    
    results = db.query(
            Transaction,
            Crop.name.label("crop_name"),
            FarmerUser.full_name.label("farmer_name"),
            BuyerUser.full_name.label("buyer_name")
        )\
        .join(Crop, Transaction.crop_id == Crop.id)\
        .join(Farmer, Transaction.farmer_id == Farmer.id)\
        .join(FarmerUser, Farmer.user_id == FarmerUser.id)\
        .join(Buyer, Transaction.buyer_id == Buyer.id)\
        .join(BuyerUser, Buyer.user_id == BuyerUser.id).all()
        
    txs = []
    for t, c_name, f_name, b_name in results:
        t_dict = t.__dict__.copy()
        t_dict.pop("_sa_instance_state", None)
        t_dict["crop_name"] = c_name
        t_dict["farmer_name"] = f_name
        t_dict["buyer_name"] = b_name
        txs.append(t_dict)
    return txs

@router.get("/analytics")
def system_analytics(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    total_farmers = db.query(func.count(Farmer.id)).scalar()
    total_buyers = db.query(func.count(Buyer.id)).scalar()
    verified_buyers = db.query(func.count(Buyer.id)).filter(Buyer.is_verified == True).scalar()
    
    active_listings = db.query(func.count(ProduceListing.id)).filter(ProduceListing.status == ListingStatus.ACTIVE).scalar()
    
    total_transactions = db.query(func.count(Transaction.id)).scalar()
    completed_transactions = db.query(func.count(Transaction.id)).filter(Transaction.status == TransactionStatus.COMPLETED).scalar()
    
    total_revenue = db.query(func.sum(Transaction.total_amount)).filter(Transaction.status == TransactionStatus.COMPLETED).scalar()
    total_revenue = float(total_revenue or 0.0)
    
    return {
        "total_farmers": total_farmers,
        "total_buyers": total_buyers,
        "verified_buyers": verified_buyers,
        "active_listings": active_listings,
        "total_transactions": total_transactions,
        "completed_transactions": completed_transactions,
        "total_revenue": total_revenue
    }
