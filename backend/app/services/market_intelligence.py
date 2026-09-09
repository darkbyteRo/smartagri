from sqlalchemy.orm import Session
from app.models.market import Market, District
from app.models.price import MarketPrice, TransportRate
from app.models.crop import Crop
from app.utils.distance import haversine_distance, estimate_transport_cost, estimate_travel_time_hours
from datetime import date, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class MarketIntelligenceEngine:
    """Core engine that compares markets and calculates net realization."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_current_price(self, crop_id: int, market_id: int) -> Optional[MarketPrice]:
        """Get the most recent price for a crop at a market."""
        return self.db.query(MarketPrice).filter(
            MarketPrice.crop_id == crop_id,
            MarketPrice.market_id == market_id
        ).order_by(MarketPrice.price_date.desc()).first()
    
    def get_transport_rate(self) -> float:
        """Get active transport rate per km per ton."""
        rate = self.db.query(TransportRate).filter(
            TransportRate.is_active == True
        ).first()
        return rate.rate_per_km_per_ton if rate else 4.0
    
    def estimate_demand_level(self, crop_id: int, market_id: int) -> str:
        """Estimate demand based on recent arrival quantities and price trends.
        Returns LOW, MEDIUM, or HIGH."""
        # Get last 7 days of prices
        recent_prices = self.db.query(MarketPrice).filter(
            MarketPrice.crop_id == crop_id,
            MarketPrice.market_id == market_id,
            MarketPrice.price_date >= date.today() - timedelta(days=7)
        ).order_by(MarketPrice.price_date.desc()).all()
        
        if len(recent_prices) < 2:
            return "MEDIUM"  # insufficient data
        
        # Check price trend
        latest = recent_prices[0].modal_price
        oldest = recent_prices[-1].modal_price
        price_change_pct = ((latest - oldest) / oldest) * 100 if oldest > 0 else 0
        
        # Check arrival volumes
        avg_arrival = sum(p.arrival_qty or 0 for p in recent_prices) / len(recent_prices)
        
        if price_change_pct > 5 and avg_arrival > 200:
            return "HIGH"
        elif price_change_pct < -5:
            return "LOW"
        else:
            return "MEDIUM"
    
    def compare_markets(
        self,
        crop_id: int,
        quantity_kg: float,
        farmer_lat: float,
        farmer_lon: float,
        quality_grade: str = "B",
        max_distance_km: float = 300.0
    ) -> list[dict]:
        """Compare all active markets for a given crop.
        
        For each market, calculate:
        - Current price
        - Distance from farmer
        - Transport cost
        - Market fees
        - Estimated net realization
        - Demand level
        
        Returns markets ranked by net realization (highest first).
        """
        markets = self.db.query(Market).filter(Market.is_active == True).all()
        crop = self.db.query(Crop).filter(Crop.id == crop_id).first()
        
        if not crop:
            raise ValueError(f"Crop with id {crop_id} not found")
        
        transport_rate = self.get_transport_rate()
        comparisons = []
        
        for market in markets:
            # Get current price
            current_price = self.get_current_price(crop_id, market.id)
            if not current_price:
                continue  # Skip markets with no price data
            
            # Calculate distance
            distance_km = haversine_distance(
                farmer_lat, farmer_lon,
                market.latitude, market.longitude
            )
            
            # Skip markets beyond max distance
            if distance_km > max_distance_km:
                continue
            
            # Apply quality adjustment
            quality_multiplier = {"A": 1.10, "B": 1.00, "C": 0.85}.get(quality_grade, 1.0)
            adjusted_price = current_price.modal_price * quality_multiplier
            
            # Calculate financials
            gross_revenue = adjusted_price * quantity_kg
            transport_cost = estimate_transport_cost(distance_km, quantity_kg, transport_rate)
            market_fee = gross_revenue * (market.market_fee_percent / 100)
            net_realization = gross_revenue - transport_cost - market_fee
            net_per_kg = net_realization / quantity_kg if quantity_kg > 0 else 0
            
            # Estimate demand
            demand_level = self.estimate_demand_level(crop_id, market.id)
            
            # Get district name
            district = self.db.query(District).filter(District.id == market.district_id).first()
            
            travel_time = estimate_travel_time_hours(distance_km)
            
            comparisons.append({
                "market": {
                    "id": market.id,
                    "name": market.name,
                    "name_telugu": market.name_telugu,
                    "district_id": market.district_id,
                    "district_name": district.name if district else None,
                    "latitude": market.latitude,
                    "longitude": market.longitude,
                    "market_type": market.market_type.value if hasattr(market.market_type, 'value') else str(market.market_type),
                    "market_fee_percent": market.market_fee_percent,
                },
                "current_price": {
                    "id": current_price.id,
                    "modal_price": current_price.modal_price,
                    "min_price": current_price.min_price,
                    "max_price": current_price.max_price,
                    "price_date": str(current_price.price_date),
                    "source": current_price.source,
                    "arrival_qty": current_price.arrival_qty,
                },
                "distance_km": round(distance_km, 1),
                "travel_time_hours": round(travel_time, 1),
                "transport_cost": round(transport_cost, 2),
                "transport_cost_per_kg": round(transport_cost / quantity_kg, 2) if quantity_kg > 0 else 0,
                "market_fee": round(market_fee, 2),
                "quality_grade": quality_grade,
                "quality_adjustment": quality_multiplier,
                "adjusted_price_per_kg": round(adjusted_price, 2),
                "gross_revenue": round(gross_revenue, 2),
                "net_realization": round(net_realization, 2),
                "net_per_kg": round(net_per_kg, 2),
                "demand_level": demand_level,
                "rank": 0,  # will be set after sorting
                "explanation": "",  # will be set after sorting
            })
        
        # Sort by net realization (highest first) and assign ranks
        comparisons.sort(key=lambda x: x["net_realization"], reverse=True)
        for i, comp in enumerate(comparisons):
            comp["rank"] = i + 1
            if i == 0:
                comp["explanation"] = (
                    f"{comp['market']['name']} offers the highest estimated net realization of "
                    f"₹{comp['net_per_kg']:.2f}/kg after transportation (₹{comp['transport_cost_per_kg']:.2f}/kg) "
                    f"and market fees (₹{comp['market_fee']:.2f}). "
                    f"Distance: {comp['distance_km']} km. Demand: {comp['demand_level']}."
                )
            else:
                best = comparisons[0]
                diff = best["net_per_kg"] - comp["net_per_kg"]
                comp["explanation"] = (
                    f"{comp['market']['name']} offers ₹{comp['net_per_kg']:.2f}/kg net realization, "
                    f"which is ₹{diff:.2f}/kg less than the best option ({best['market']['name']}). "
                    f"Distance: {comp['distance_km']} km."
                )
        
        return comparisons
