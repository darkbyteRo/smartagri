from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.dependencies import get_current_user, get_current_farmer, get_current_buyer
from app.models.listing import ProduceListing, ListingStatus
from app.models.crop import Crop
from app.models.farmer import Farmer
from app.models.user import RoleEnum
from app.schemas.listing import ListingCreate, ListingUpdate, ListingResponse

router = APIRouter(prefix="/api/listings", tags=["Listings"])

@router.post("/", response_model=ListingResponse)
def create_listing(
    listing: ListingCreate,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer)
):
    db_listing = ProduceListing(
        farmer_id=farmer.id,
        **listing.model_dump()
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    
    # populate response fields
    db_listing.crop_name = db_listing.crop.name if db_listing.crop else ""
    db_listing.farmer_name = farmer.user.full_name if farmer.user else ""
    db_listing.district_name = farmer.district.name if farmer.district else ""
    return db_listing

@router.get("/", response_model=List[ListingResponse])
def get_listings(
    crop_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(ProduceListing)
    if user.role == RoleEnum.FARMER:
        farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
        query = query.filter(ProduceListing.farmer_id == farmer.id)
    else:
        query = query.filter(ProduceListing.status == ListingStatus.ACTIVE)
        if crop_id:
            query = query.filter(ProduceListing.crop_id == crop_id)
            
    listings = query.all()
    for l in listings:
        l.crop_name = l.crop.name if l.crop else ""
        l.farmer_name = l.farmer.user.full_name if (l.farmer and l.farmer.user) else ""
        l.district_name = l.farmer.district.name if (l.farmer and l.farmer.district) else ""
    return listings

@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: uuid.UUID, db: Session = Depends(get_db)):
    l = db.query(ProduceListing).filter(ProduceListing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")
    l.crop_name = l.crop.name if l.crop else ""
    l.farmer_name = l.farmer.user.full_name if (l.farmer and l.farmer.user) else ""
    l.district_name = l.farmer.district.name if (l.farmer and l.farmer.district) else ""
    return l

@router.put("/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: uuid.UUID,
    listing_update: ListingUpdate,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer)
):
    l = db.query(ProduceListing).filter(ProduceListing.id == listing_id, ProduceListing.farmer_id == farmer.id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    update_data = listing_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(l, key, value)
        
    db.commit()
    db.refresh(l)
    l.crop_name = l.crop.name if l.crop else ""
    l.farmer_name = l.farmer.user.full_name if (l.farmer and l.farmer.user) else ""
    l.district_name = l.farmer.district.name if (l.farmer and l.farmer.district) else ""
    return l

@router.delete("/{listing_id}", response_model=ListingResponse)
def cancel_listing(
    listing_id: uuid.UUID,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer)
):
    l = db.query(ProduceListing).filter(ProduceListing.id == listing_id, ProduceListing.farmer_id == farmer.id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    l.status = ListingStatus.CANCELLED
    db.commit()
    db.refresh(l)
    l.crop_name = l.crop.name if l.crop else ""
    l.farmer_name = l.farmer.user.full_name if (l.farmer and l.farmer.user) else ""
    l.district_name = l.farmer.district.name if (l.farmer and l.farmer.district) else ""
    return l
