import logging
import json
from sqlalchemy.orm import Session
from app.services.sarvam_ai import get_sarvam_service
from datetime import date

logger = logging.getLogger(__name__)

class AssistantService:
    """Orchestrates the AI assistant flow:
    
    1. Receive user message (text or transcribed speech)
    2. Detect intent (price check, sell/hold, find buyer, etc.)
    3. Retrieve relevant data from backend
    4. Send data + user query to Sarvam AI for natural language response
    5. Return response
    
    The LLM NEVER invents data - it only formats/explains backend data.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.sarvam = get_sarvam_service()
    
    async def process_message(
        self, 
        message: str, 
        farmer_id: str = None,
        farmer_lat: float = None,
        farmer_lon: float = None,
    ) -> dict:
        """Process a user message and return a response with relevant data."""
        
        # Step 1: Detect intent from message
        intent = self._detect_intent(message)
        
        # Step 2: Retrieve relevant data based on intent
        context_data = await self._get_context_data(
            intent, message, farmer_id, farmer_lat, farmer_lon
        )
        
        # Step 3: Format context for LLM
        context_str = self._format_context(intent, context_data)
        
        # Step 4: Get AI response
        ai_response = await self.sarvam.chat(message, context_str)
        
        return {
            "response": ai_response,
            "intent": intent,
            "data": context_data,
            "source": "sarvam_ai" if self.sarvam.enabled else "fallback",
        }
    
    def _detect_intent(self, message: str) -> str:
        """Simple keyword-based intent detection.
        Supports English and Telugu keywords."""
        msg = message.lower()
        
        # Price-related
        price_keywords = ['price', 'rate', 'cost', 'dhara', 'ధర', 'vila', 'విల', 'ekkuva', 'ఎక్కువ']
        if any(kw in msg for kw in price_keywords):
            return "PRICE_CHECK"
        
        # Sell/Hold
        sell_keywords = ['sell', 'hold', 'ammali', 'అమ్మాలి', 'apali', 'wait', 'aagali', 'ఆగాలి']
        if any(kw in msg for kw in sell_keywords):
            return "SELL_HOLD"
        
        # Market
        market_keywords = ['market', 'mandi', 'ekkada', 'ఎక్కడ', 'where', 'best place']
        if any(kw in msg for kw in market_keywords):
            return "MARKET_COMPARE"
        
        # Buyer
        buyer_keywords = ['buyer', 'purchase', 'konugolu', 'కొనుగోలు', 'customer']
        if any(kw in msg for kw in buyer_keywords):
            return "FIND_BUYER"
        
        # Crop
        crop_keywords = ['tomato', 'onion', 'paddy', 'cotton', 'maize', 
                         'టమాటా', 'ఉల్లిపాయ', 'వరి', 'పత్తి', 'మొక్కజొన్న']
        if any(kw in msg for kw in crop_keywords):
            return "PRICE_CHECK"  # default to price check for crop mentions
        
        return "GENERAL"
    
    async def _get_context_data(self, intent: str, message: str, farmer_id, farmer_lat, farmer_lon) -> dict:
        """Retrieve relevant backend data based on detected intent."""
        context = {}
        
        try:
            if intent in ["PRICE_CHECK", "MARKET_COMPARE", "SELL_HOLD"]:
                # Get current prices for all crops
                from app.models.crop import Crop
                from app.models.price import MarketPrice
                from app.models.market import Market
                
                crops = self.db.query(Crop).filter(Crop.is_active == True).all()
                context["available_crops"] = [{"id": c.id, "name": c.name, "name_telugu": c.name_telugu} for c in crops]
                
                # Detect crop from message
                detected_crop = None
                for crop in crops:
                    if crop.name.lower() in message.lower() or (crop.name_telugu and crop.name_telugu in message):
                        detected_crop = crop
                        break
                
                # Detect market or district from message
                from app.models.market import District
                districts = self.db.query(District).all()
                markets = self.db.query(Market).all()
                detected_location = None
                for d in districts:
                    if d.name.lower() in message.lower():
                        detected_location = d.name
                        break
                if not detected_location:
                    for m in markets:
                        m_base = m.name.split('(')[0].strip().lower()
                        if m_base in message.lower() or (m.name_telugu and m.name_telugu in message):
                            detected_location = m.name
                            break

                from sqlalchemy import func
                if detected_crop:
                    # Get latest prices across markets for detected crop
                    subq = self.db.query(
                        MarketPrice.market_id,
                        func.max(MarketPrice.price_date).label('max_date')
                    ).filter(
                        MarketPrice.crop_id == detected_crop.id
                    ).group_by(MarketPrice.market_id).subquery()
                    
                    prices_query = self.db.query(MarketPrice, Market).join(
                        subq,
                        (MarketPrice.market_id == subq.c.market_id) & 
                        (MarketPrice.price_date == subq.c.max_date)
                    ).join(Market, MarketPrice.market_id == Market.id).filter(
                        MarketPrice.crop_id == detected_crop.id
                    ).all()
                    
                    # Sort matching location to the very front if detected
                    if detected_location:
                        prices_query.sort(
                            key=lambda item: 0 if detected_location.lower() in item[1].name.lower() else 1
                        )
                    
                    context["crop"] = {"id": detected_crop.id, "name": detected_crop.name}
                    if detected_location:
                        context["requested_location"] = detected_location
                    context["prices"] = [{
                        "market": m.name,
                        "modal_price": p.modal_price,
                        "min_price": p.min_price,
                        "max_price": p.max_price,
                        "date": str(p.price_date),
                        "source": p.source,
                    } for p, m in prices_query[:10]]
                elif detected_location:
                    # Crop not specified, but location is: fetch all crops in this location's markets
                    matching_markets = [m for m in markets if detected_location.lower() in m.name.lower()]
                    m_ids = [m.id for m in matching_markets]
                    if m_ids:
                        subq = self.db.query(
                            MarketPrice.crop_id,
                            func.max(MarketPrice.price_date).label('max_date')
                        ).filter(MarketPrice.market_id.in_(m_ids)).group_by(MarketPrice.crop_id).subquery()

                        prices_query = self.db.query(MarketPrice, Market, Crop).join(
                            subq,
                            (MarketPrice.crop_id == subq.c.crop_id) & 
                            (MarketPrice.price_date == subq.c.max_date)
                        ).join(Market, MarketPrice.market_id == Market.id).join(
                            Crop, MarketPrice.crop_id == Crop.id
                        ).filter(MarketPrice.market_id.in_(m_ids)).all()

                        context["requested_location"] = detected_location
                        context["prices"] = [{
                            "crop": c.name,
                            "market": m.name,
                            "modal_price": p.modal_price,
                            "min_price": p.min_price,
                            "max_price": p.max_price,
                            "date": str(p.price_date),
                            "source": p.source,
                        } for p, m, c in prices_query]
            
            if intent == "FIND_BUYER":
                from app.models.buyer import Buyer
                from app.models.user import User
                buyers = self.db.query(Buyer, User).join(User, Buyer.user_id == User.id).filter(
                    Buyer.is_verified == True
                ).limit(5).all()
                context["verified_buyers"] = [{
                    "business_name": b.business_name,
                    "business_type": b.business_type,
                    "reliability_score": b.reliability_score,
                } for b, u in buyers]
        
        except Exception as e:
            logger.error(f"Error retrieving context data: {e}")
            context["error"] = "Some data could not be retrieved."
        
        return context
    
    def _format_context(self, intent: str, data: dict) -> str:
        """Format context data as a readable string for the LLM."""
        if not data:
            return "No data available from our system."
        
        parts = []
        
        if "crop" in data:
            parts.append(f"Crop: {data['crop']['name']}")
        
        if "prices" in data:
            parts.append("\nCurrent Market Prices:")
            for p in data["prices"]:
                parts.append(
                    f"  {p['market']}: ₹{p['modal_price']}/kg "
                    f"(range: ₹{p['min_price']}-₹{p['max_price']}) "
                    f"[Date: {p['date']}, Source: {p['source']}]"
                )
        
        if "verified_buyers" in data:
            parts.append("\nVerified Buyers:")
            for b in data["verified_buyers"]:
                parts.append(
                    f"  {b['business_name']} ({b['business_type']}) "
                    f"- Reliability: {b['reliability_score']}/100"
                )
        
        if "available_crops" in data and "crop" not in data:
            parts.append("\nAvailable crops: " + ", ".join(
                f"{c['name']} ({c['name_telugu']})" for c in data["available_crops"]
            ))
        
        if "error" in data:
            parts.append(f"\nNote: {data['error']}")
        
        parts.append("\nIMPORTANT: All prices shown are from demo/simulated data unless otherwise noted.")
        
        return "\n".join(parts)
