from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import uuid

from pydantic import BaseModel
from app.database import get_db
from app.dependencies import get_current_user, get_current_farmer
from app.models.farmer import Farmer
from app.models.listing import ProduceListing, ListingStatus
from app.models.offer import BuyerOffer, OfferStatus
from app.models.transaction import Transaction
from app.models.user import RoleEnum
from app.schemas.listing import ListingCreate, ListingResponse

router = APIRouter(prefix="/api/farmer", tags=["Farmer"])


def _to_uuid(val):
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")


class StatusUpdate(BaseModel):
    status: str


@router.get("/dashboard")
def get_farmer_dashboard(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()

    # Build farmer info
    farmer_info = None
    if farmer:
        farmer_info = {
            "id": str(farmer.id),
            "district_name": farmer.district.name if farmer.district else None,
            "village": farmer.village,
            "land_area_acres": farmer.land_area_acres,
        }

    # Active listings
    active_listings = []
    if farmer:
        listings = db.query(ProduceListing).filter(
            ProduceListing.farmer_id == farmer.id,
            ProduceListing.status == ListingStatus.ACTIVE
        ).all()
        for l in listings:
            active_listings.append({
                "id": str(l.id),
                "crop_name": l.crop.name if l.crop else "",
                "quantity_kg": l.quantity_kg,
                "quality_grade": l.quality_grade,
                "expected_price_per_kg": l.expected_price_per_kg,
                "status": l.status.value if hasattr(l.status, 'value') else str(l.status),
            })

    # Pending offers on farmer's listings
    pending_offers = []
    if farmer:
        offers = db.query(BuyerOffer).join(ProduceListing).filter(
            ProduceListing.farmer_id == farmer.id,
            BuyerOffer.status == OfferStatus.PENDING
        ).all()
        for o in offers:
            pending_offers.append({
                "id": str(o.id),
                "buyer_name": o.buyer.user.full_name if (o.buyer and o.buyer.user) else "Buyer",
                "offered_price_per_kg": o.offered_price_per_kg,
                "quantity_kg": o.quantity_kg,
            })

    return {
        "farmer": farmer_info,
        "active_listings": active_listings,
        "pending_offers": pending_offers,
        "recent_recommendations": [],
        "recent_transactions": [],
    }


@router.get("/listings")
def get_farmer_listings(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
    if not farmer:
        return []

    listings = db.query(ProduceListing).filter(
        ProduceListing.farmer_id == farmer.id
    ).order_by(ProduceListing.created_at.desc()).all()

    result = []
    for l in listings:
        result.append({
            "id": str(l.id),
            "crop_id": l.crop_id,
            "crop_name": l.crop.name if l.crop else "",
            "quantity_kg": l.quantity_kg,
            "quality_grade": l.quality_grade,
            "expected_price_per_kg": l.expected_price_per_kg,
            "harvest_date": str(l.harvest_date) if l.harvest_date else None,
            "available_from": str(l.available_from) if l.available_from else None,
            "status": l.status.value if hasattr(l.status, 'value') else str(l.status),
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })
    return result


@router.post("/listings")
def create_farmer_listing(
    listing: ListingCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
    if not farmer:
        raise HTTPException(status_code=400, detail="Farmer profile not found")

    data = listing.model_dump()
    if not data.get("available_from"):
        data["available_from"] = date.today()

    db_listing = ProduceListing(
        farmer_id=farmer.id,
        **data
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)

    return {
        "id": str(db_listing.id),
        "crop_name": db_listing.crop.name if db_listing.crop else "",
        "quantity_kg": db_listing.quantity_kg,
        "quality_grade": db_listing.quality_grade,
        "status": db_listing.status.value if hasattr(db_listing.status, 'value') else str(db_listing.status),
    }


@router.get("/listings/{listing_id}")
def get_farmer_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    l_uuid = _to_uuid(listing_id)
    l = db.query(ProduceListing).filter(
        ProduceListing.id == l_uuid,
        ProduceListing.farmer_id == farmer.id
    ).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")

    offers = db.query(BuyerOffer).filter(BuyerOffer.listing_id == l.id).all()
    offers_data = []
    for o in offers:
        offers_data.append({
            "id": str(o.id),
            "buyer_name": o.buyer.user.full_name if (o.buyer and o.buyer.user) else "Buyer",
            "offered_price_per_kg": o.offered_price_per_kg,
            "quantity_kg": o.quantity_kg,
            "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
            "created_at": o.created_at.isoformat() if o.created_at else None
        })

    return {
        "id": str(l.id),
        "crop_id": l.crop_id,
        "crop_name": l.crop.name if l.crop else "",
        "crop_name_telugu": l.crop.name_telugu if l.crop else None,
        "quantity_kg": l.quantity_kg,
        "quality_grade": l.quality_grade,
        "expected_price_per_kg": l.expected_price_per_kg,
        "harvest_date": str(l.harvest_date) if l.harvest_date else None,
        "available_from": str(l.available_from) if l.available_from else None,
        "status": l.status.value if hasattr(l.status, 'value') else str(l.status),
        "created_at": l.created_at.isoformat() if l.created_at else None,
        "offers": offers_data
    }


@router.patch("/listings/{listing_id}/status")
def update_farmer_listing_status(
    listing_id: str,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    l_uuid = _to_uuid(listing_id)
    l = db.query(ProduceListing).filter(
        ProduceListing.id == l_uuid,
        ProduceListing.farmer_id == farmer.id
    ).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")

    status_str = payload.status.upper()
    if status_str in ListingStatus.__members__:
        l.status = ListingStatus[status_str]
    else:
        l.status = ListingStatus.CANCELLED

    db.commit()
    db.refresh(l)
    return {
        "id": str(l.id),
        "status": l.status.value if hasattr(l.status, 'value') else str(l.status),
        "message": "Listing status updated successfully"
    }


@router.delete("/listings/{listing_id}")
def delete_farmer_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    l_uuid = _to_uuid(listing_id)
    l = db.query(ProduceListing).filter(
        ProduceListing.id == l_uuid,
        ProduceListing.farmer_id == farmer.id
    ).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")

    l.status = ListingStatus.CANCELLED
    db.commit()
    return {"message": "Listing cancelled successfully"}


@router.get("/offers")
def get_farmer_offers(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
    if not farmer:
        return []

    offers = db.query(BuyerOffer).join(ProduceListing).filter(
        ProduceListing.farmer_id == farmer.id
    ).all()

    result = []
    for o in offers:
        listing = o.listing
        result.append({
            "id": str(o.id),
            "listing_id": str(o.listing_id),
            "buyer_name": o.buyer.user.full_name if (o.buyer and o.buyer.user) else "Buyer",
            "buyer_business_name": o.buyer.business_name if o.buyer else "",
            "buyer_verified": o.buyer.is_verified if o.buyer else False,
            "buyer_reliability_score": o.buyer.reliability_score if o.buyer else 0,
            "offered_price_per_kg": o.offered_price_per_kg,
            "quantity_kg": o.quantity_kg,
            "message": o.message,
            "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "listing": {
                "id": str(listing.id),
                "crop_name": listing.crop.name if listing.crop else "",
                "quantity_kg": listing.quantity_kg,
                "quality_grade": listing.quality_grade,
            } if listing else None,
        })
    return result
