from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.dependencies import get_current_user, get_current_farmer, get_current_buyer
from app.models.offer import BuyerOffer, OfferStatus
from app.models.listing import ProduceListing, ListingStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.farmer import Farmer
from app.models.buyer import Buyer
from app.models.user import RoleEnum
from app.schemas.offer import OfferCreate, OfferResponse

router = APIRouter(prefix="/api/offers", tags=["Offers"])

def _populate_offer(db, o):
    o.buyer_name = o.buyer.user.full_name if (o.buyer and o.buyer.user) else ""
    o.buyer_business_name = o.buyer.business_name if o.buyer else ""
    o.buyer_verified = o.buyer.is_verified if o.buyer else False
    o.buyer_reliability_score = o.buyer.reliability_score if o.buyer else 0.0
    
    l = o.listing
    l.crop_name = l.crop.name if l.crop else ""
    l.farmer_name = l.farmer.user.full_name if (l.farmer and l.farmer.user) else ""
    l.district_name = l.farmer.district.name if (l.farmer and l.farmer.district) else ""
    o.listing = l
    return o

@router.post("/", response_model=OfferResponse)
def create_offer(
    offer: OfferCreate,
    db: Session = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer)
):
    listing = db.query(ProduceListing).filter(ProduceListing.id == offer.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Listing is not active")
        
    db_offer = BuyerOffer(
        buyer_id=buyer.id,
        listing_id=offer.listing_id,
        offered_price_per_kg=offer.offered_price_per_kg,
        quantity_kg=offer.quantity_kg,
        message=offer.message
    )
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    return _populate_offer(db, db_offer)

@router.get("/", response_model=List[OfferResponse])
def get_offers(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(BuyerOffer)
    if user.role == RoleEnum.FARMER:
        farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
        query = query.join(ProduceListing).filter(ProduceListing.farmer_id == farmer.id)
    elif user.role == RoleEnum.BUYER:
        buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
        query = query.filter(BuyerOffer.buyer_id == buyer.id)
        
    offers = query.all()
    for o in offers:
        _populate_offer(db, o)
    return offers

@router.put("/{offer_id}/accept")
def accept_offer(
    offer_id: uuid.UUID,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer)
):
    offer = db.query(BuyerOffer).join(ProduceListing).filter(
        BuyerOffer.id == offer_id,
        ProduceListing.farmer_id == farmer.id
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    offer.status = OfferStatus.ACCEPTED
    listing = offer.listing
    listing.status = ListingStatus.SOLD
    
    # Reject other offers
    other_offers = db.query(BuyerOffer).filter(
        BuyerOffer.listing_id == listing.id,
        BuyerOffer.id != offer.id,
        BuyerOffer.status == OfferStatus.PENDING
    ).all()
    for o in other_offers:
        o.status = OfferStatus.REJECTED
        
    # Create transaction
    tx = Transaction(
        offer_id=offer.id,
        farmer_id=farmer.id,
        buyer_id=offer.buyer_id,
        crop_id=listing.crop_id,
        quantity_kg=offer.quantity_kg,
        agreed_price_per_kg=offer.offered_price_per_kg,
        total_amount=offer.quantity_kg * offer.offered_price_per_kg,
        status=TransactionStatus.INITIATED
    )
    db.add(tx)
    db.commit()
    return {"message": "Offer accepted and transaction initiated."}

@router.put("/{offer_id}/reject")
def reject_offer(
    offer_id: uuid.UUID,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer)
):
    offer = db.query(BuyerOffer).join(ProduceListing).filter(
        BuyerOffer.id == offer_id,
        ProduceListing.farmer_id == farmer.id
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    offer.status = OfferStatus.REJECTED
    db.commit()
    return {"message": "Offer rejected."}

@router.put("/{offer_id}/withdraw")
def withdraw_offer(
    offer_id: uuid.UUID,
    db: Session = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer)
):
    offer = db.query(BuyerOffer).filter(BuyerOffer.id == offer_id, BuyerOffer.buyer_id == buyer.id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    offer.status = OfferStatus.WITHDRAWN
    db.commit()
    return {"message": "Offer withdrawn."}
