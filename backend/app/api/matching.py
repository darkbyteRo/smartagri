from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.dependencies import get_current_farmer, get_current_buyer
from app.models.farmer import Farmer
from app.models.buyer import Buyer
from app.schemas.buyer import BuyerMatchResult
from app.services.buyer_matching import BuyerMatchingEngine

router = APIRouter(prefix="/api/matching", tags=["Matching"])

@router.get("/buyers/{listing_id}", response_model=List[BuyerMatchResult])
def find_matching_buyers(
    listing_id: uuid.UUID,
    db: Session = Depends(get_db),
    farmer: Farmer = Depends(get_current_farmer)
):
    # Pass farmer's lat/lon
    lat = farmer.latitude if farmer.latitude else 0.0
    lon = farmer.longitude if farmer.longitude else 0.0
    
    engine = BuyerMatchingEngine(db)
    matches = engine.find_matching_buyers(str(listing_id), lat, lon)
    return matches

@router.get("/listings")
def find_matching_listings(
    db: Session = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer)
):
    engine = BuyerMatchingEngine(db)
    matches = engine.find_matching_listings(str(buyer.id))
    return matches
