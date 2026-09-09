from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.dependencies import get_current_buyer
from app.models.buyer import BuyerRequirement, Buyer
from app.schemas.buyer import BuyerRequirementCreate, BuyerRequirementResponse
from app.services.buyer_matching import BuyerMatchingEngine

router = APIRouter(prefix="/api/requirements", tags=["Requirements"])

@router.post("/", response_model=BuyerRequirementResponse)
def create_requirement(
    req: BuyerRequirementCreate,
    db: Session = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer)
):
    db_req = BuyerRequirement(
        buyer_id=buyer.id,
        **req.model_dump()
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    db_req.crop_name = db_req.crop.name if db_req.crop else ""
    return db_req

@router.get("/", response_model=List[BuyerRequirementResponse])
def get_requirements(
    db: Session = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer)
):
    reqs = db.query(BuyerRequirement).filter(BuyerRequirement.buyer_id == buyer.id).all()
    for r in reqs:
        r.crop_name = r.crop.name if r.crop else ""
    return reqs

@router.get("/{requirement_id}/matches")
def get_requirement_matches(
    requirement_id: uuid.UUID,
    db: Session = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer)
):
    # This is a stub for finding matching listings
    req = db.query(BuyerRequirement).filter(BuyerRequirement.id == requirement_id, BuyerRequirement.buyer_id == buyer.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
        
    engine = BuyerMatchingEngine(db)
    matches = engine.find_matching_listings(str(buyer.id))
    # Filter for this specific requirement
    req_matches = [m for m in matches if m["requirement_id"] == req.id]
    return req_matches
