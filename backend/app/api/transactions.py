from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.dependencies import get_current_user
from app.models.transaction import Transaction
from app.models.farmer import Farmer
from app.models.buyer import Buyer
from app.models.user import RoleEnum
from app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

def _populate_tx(tx):
    tx.crop_name = tx.crop.name if tx.crop else ""
    tx.farmer_name = tx.farmer.user.full_name if (tx.farmer and tx.farmer.user) else ""
    tx.buyer_name = tx.buyer.user.full_name if (tx.buyer and tx.buyer.user) else ""
    return tx

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(Transaction)
    if user.role == RoleEnum.FARMER:
        farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
        query = query.filter(Transaction.farmer_id == farmer.id)
    elif user.role == RoleEnum.BUYER:
        buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
        query = query.filter(Transaction.buyer_id == buyer.id)
        
    txs = query.all()
    for tx in txs:
        _populate_tx(tx)
    return txs

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if user.role == RoleEnum.FARMER:
        farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
        if tx.farmer_id != farmer.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif user.role == RoleEnum.BUYER:
        buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
        if tx.buyer_id != buyer.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
    return _populate_tx(tx)
