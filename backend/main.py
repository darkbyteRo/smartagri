from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from app.config import settings
from app.auth.router import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    yield
    logger.info("Shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import crops, markets, prices, predictions
from app.api.recommendations import router as recommendations_router
from app.api.listings import router as listings_router
from app.api.buyers import router as buyers_router
from app.api.matching import router as matching_router
from app.api.offers import router as offers_router
from app.api.transactions import router as transactions_router
from app.api.sell_hold import router as sell_hold_router
from app.api.assistant import router as assistant_router
from app.api.farmer import router as farmer_router

app.include_router(crops.router)
app.include_router(markets.router)
app.include_router(prices.router)
app.include_router(predictions.router)
app.include_router(recommendations_router)
app.include_router(sell_hold_router)
app.include_router(listings_router)
app.include_router(buyers_router)
app.include_router(matching_router)
app.include_router(offers_router)
app.include_router(transactions_router)
app.include_router(assistant_router)
app.include_router(farmer_router)

from app.api.admin import router as admin_router
app.include_router(admin_router)
app.include_router(auth_router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
