from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.crop import Crop
from app.schemas.crop import CropCreate, CropResponse

router = APIRouter(prefix="/api/crops", tags=["crops"])

@router.get("/", response_model=List[CropResponse])
def get_crops(db: Session = Depends(get_db)):
    return db.query(Crop).filter(Crop.is_active == True).all()

@router.get("/{crop_id}", response_model=CropResponse)
def get_crop(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return crop

@router.post("/", response_model=CropResponse)
def create_crop(crop: CropCreate, db: Session = Depends(get_db)):
    db_crop = Crop(**crop.model_dump())
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop
