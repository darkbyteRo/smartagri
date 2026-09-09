from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class SellHoldEngine:
    """Decision engine that recommends whether a farmer should sell now or hold.
    
    The recommendation considers:
    - Current market price vs predicted future price
    - Transportation costs
    - Storage costs (estimated based on crop type)
    - Spoilage/wastage risk (based on crop shelf life)
    - Price volatility (risk)
    - Prediction confidence
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def recommend(
        self,
        crop_id: int,
        quantity_kg: float,
        farmer_lat: float,
        farmer_lon: float,
        quality_grade: str = "B",
        harvest_date: Optional[date] = None,
        storage_cost_per_kg_per_day: float = 0.10,  # ₹0.10/kg/day default
    ) -> dict:
        """Generate sell/hold recommendation.
        
        Logic:
        1. Get market comparison (best market, net realization)
        2. Get price predictions for 1-7 days
        3. Calculate expected future value accounting for:
           - Predicted price change
           - Storage costs over hold period
           - Spoilage/wastage losses
           - Transport cost (same or different market)
        4. Compare current net vs expected future net
        5. Generate recommendation with confidence and explanation
        
        Returns:
        {
            recommendation: SELL | HOLD | SELL_PARTIALLY,
            current_best_price: float,
            current_net_per_kg: float,
            predicted_future_price: float (best predicted),
            expected_future_net_per_kg: float,
            expected_benefit_per_kg: float,
            total_expected_benefit: float,
            risk_level: LOW | MEDIUM | HIGH,
            confidence: float (0-1),
            hold_days: int (recommended hold period),
            explanation: str (detailed human-readable explanation),
            factors: dict (breakdown of all factors),
            best_market: dict (market comparison result),
            market_comparisons: list,
            price_predictions: list,
        }
        """
        from app.services.market_intelligence import MarketIntelligenceEngine
        
        # Step 1: Get market comparison
        mkt_engine = MarketIntelligenceEngine(self.db)
        comparisons = mkt_engine.compare_markets(
            crop_id=crop_id,
            quantity_kg=quantity_kg,
            farmer_lat=farmer_lat,
            farmer_lon=farmer_lon,
            quality_grade=quality_grade,
        )
        
        if not comparisons:
            return {
                "recommendation": "SELL",
                "explanation": "Unable to compare markets. No price data available. Consider selling at your nearest market.",
                "confidence": 0.1,
                "risk_level": "HIGH",
                "market_comparisons": [],
                "price_predictions": [],
            }
        
        best_market = comparisons[0]
        current_net_per_kg = best_market["net_per_kg"]
        current_price = best_market["current_price"]["modal_price"]
        
        # Step 2: Get crop details for spoilage calculation
        from app.models.crop import Crop
        crop = self.db.query(Crop).filter(Crop.id == crop_id).first()
        spoilage_rate = (crop.spoilage_rate_per_day or 0) / 100  # convert percentage to decimal
        shelf_life = crop.avg_shelf_life_days or 30
        
        # Step 3: Get price predictions
        try:
            from app.ml.predictor import PricePredictor
            predictor = PricePredictor(self.db)
            predictions = predictor.predict_range(crop_id, best_market["market"]["id"], days=7)
        except Exception as e:
            logger.warning(f"Price prediction failed: {e}")
            predictions = []
        
        # Step 4: Find the best hold period
        best_hold_days = 0
        best_future_net = current_net_per_kg
        best_prediction = None
        hold_analysis = []
        
        for pred in predictions:
            if not pred or "predicted_price" not in pred:
                continue
            
            days_ahead = predictions.index(pred) + 1
            predicted_price = pred["predicted_price"]
            
            # Calculate costs of holding
            storage_cost = storage_cost_per_kg_per_day * days_ahead
            spoilage_loss = quantity_kg * spoilage_rate * days_ahead  # kg lost
            remaining_qty = quantity_kg * (1 - spoilage_rate * days_ahead)
            remaining_qty = max(remaining_qty, 0)
            
            # Quality adjustment for predicted price
            quality_multiplier = {"A": 1.10, "B": 1.00, "C": 0.85}.get(quality_grade, 1.0)
            adjusted_predicted = predicted_price * quality_multiplier
            
            # Recalculate net with predicted price
            future_gross_per_kg = adjusted_predicted
            transport_cost_per_kg = best_market["transport_cost_per_kg"]
            market_fee_pct = best_market["market"]["market_fee_percent"] / 100
            future_net_per_kg = future_gross_per_kg - transport_cost_per_kg - (future_gross_per_kg * market_fee_pct) - storage_cost
            
            # Account for spoilage in total value
            effective_future_net_per_kg = future_net_per_kg * (1 - spoilage_rate * days_ahead)
            
            hold_analysis.append({
                "days": days_ahead,
                "predicted_price": predicted_price,
                "storage_cost_per_kg": round(storage_cost, 2),
                "spoilage_pct": round(spoilage_rate * days_ahead * 100, 1),
                "future_net_per_kg": round(effective_future_net_per_kg, 2),
                "benefit_per_kg": round(effective_future_net_per_kg - current_net_per_kg, 2),
                "confidence": pred.get("confidence", 0.5),
            })
            
            if effective_future_net_per_kg > best_future_net:
                best_future_net = effective_future_net_per_kg
                best_hold_days = days_ahead
                best_prediction = pred
        
        # Step 5: Generate recommendation
        benefit_per_kg = best_future_net - current_net_per_kg
        benefit_pct = (benefit_per_kg / current_net_per_kg * 100) if current_net_per_kg > 0 else 0
        total_benefit = benefit_per_kg * quantity_kg
        
        # Determine confidence
        prediction_confidence = best_prediction.get("confidence", 0.3) if best_prediction else 0.3
        
        # Calculate volatility from recent prices
        from app.models.price import MarketPrice
        recent_prices = self.db.query(MarketPrice).filter(
            MarketPrice.crop_id == crop_id,
            MarketPrice.market_id == best_market["market"]["id"],
            MarketPrice.price_date >= date.today() - timedelta(days=14)
        ).all()
        
        if len(recent_prices) > 1:
            prices = [p.modal_price for p in recent_prices]
            import numpy as np
            volatility = float(np.std(prices) / np.mean(prices)) if np.mean(prices) > 0 else 0
        else:
            volatility = 0.1
        
        # Risk assessment
        if volatility > 0.15 or spoilage_rate > 0.02:
            risk_level = "HIGH"
        elif volatility > 0.08 or spoilage_rate > 0.005:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Decision logic
        if benefit_pct > 5 and prediction_confidence > 0.5 and risk_level != "HIGH":
            recommendation = "HOLD"
        elif benefit_pct > 3 and prediction_confidence > 0.4:
            recommendation = "SELL_PARTIALLY"  # sell 50%, hold 50%
        else:
            recommendation = "SELL"
        
        # For perishable crops with high spoilage, lean towards SELL
        if spoilage_rate > 0.02 and best_hold_days > 3:
            recommendation = "SELL"
            
        # Overall confidence
        overall_confidence = prediction_confidence * 0.6 + (1 - volatility) * 0.4
        overall_confidence = max(0.1, min(0.95, overall_confidence))
        
        # Generate explanation
        explanation = self._generate_explanation(
            recommendation=recommendation,
            crop_name=crop.name,
            current_net=current_net_per_kg,
            best_market_name=best_market["market"]["name"],
            benefit_per_kg=benefit_per_kg,
            benefit_pct=benefit_pct,
            hold_days=best_hold_days,
            risk_level=risk_level,
            volatility=volatility,
            spoilage_rate=spoilage_rate,
            prediction_confidence=prediction_confidence,
            predicted_price=best_prediction["predicted_price"] if best_prediction else None,
        )
        
        return {
            "recommendation": recommendation,
            "current_best_price": current_price,
            "current_net_per_kg": round(current_net_per_kg, 2),
            "predicted_future_price": best_prediction["predicted_price"] if best_prediction else None,
            "expected_future_net_per_kg": round(best_future_net, 2),
            "expected_benefit_per_kg": round(benefit_per_kg, 2),
            "total_expected_benefit": round(total_benefit, 2),
            "risk_level": risk_level,
            "confidence": round(overall_confidence, 2),
            "hold_days": best_hold_days,
            "explanation": explanation,
            "factors": {
                "volatility": round(volatility, 4),
                "spoilage_rate_per_day": spoilage_rate,
                "storage_cost_per_kg_per_day": storage_cost_per_kg_per_day,
                "shelf_life_days": shelf_life,
                "prediction_confidence": prediction_confidence,
                "hold_analysis": hold_analysis,
            },
            "best_market": best_market,
            "market_comparisons": comparisons,
            "price_predictions": predictions,
        }
    
    def _generate_explanation(
        self, recommendation, crop_name, current_net, best_market_name,
        benefit_per_kg, benefit_pct, hold_days, risk_level, volatility,
        spoilage_rate, prediction_confidence, predicted_price
    ) -> str:
        """Generate human-readable explanation for the recommendation."""
        parts = []
        
        if recommendation == "SELL":
            parts.append(
                f"We recommend selling your {crop_name} now at {best_market_name}. "
                f"Current estimated net realization is ₹{current_net:.2f}/kg."
            )
            if predicted_price and benefit_per_kg <= 0:
                parts.append(
                    f"Predicted prices over the next {hold_days or 7} days do not show significant upward potential."
                )
            if spoilage_rate > 0.02:
                parts.append(
                    f"{crop_name} is perishable (spoilage rate: {spoilage_rate*100:.1f}%/day). "
                    f"Holding increases the risk of post-harvest losses."
                )
            if risk_level == "HIGH":
                parts.append(f"Price volatility is high, making holding risky.")
        
        elif recommendation == "HOLD":
            parts.append(
                f"Consider holding your {crop_name} for approximately {hold_days} day(s). "
                f"Predicted price is ₹{predicted_price:.2f}/kg, which could yield an additional "
                f"₹{benefit_per_kg:.2f}/kg ({benefit_pct:.1f}% improvement) after accounting for "
                f"storage costs and expected spoilage."
            )
            parts.append(f"Best market: {best_market_name}.")
        
        elif recommendation == "SELL_PARTIALLY":
            parts.append(
                f"Consider selling part of your {crop_name} now and holding the rest. "
                f"Current net: ₹{current_net:.2f}/kg at {best_market_name}. "
                f"Prices may improve by ₹{benefit_per_kg:.2f}/kg in {hold_days} day(s), "
                f"but confidence is moderate ({prediction_confidence:.0%})."
            )
        
        parts.append(
            f"\n\nRisk Level: {risk_level}. Confidence: {prediction_confidence:.0%}. "
            f"This recommendation is based on {'demo/simulated' if True else 'real'} data "
            f"and should not be treated as financial advice."
        )
        
        return " ".join(parts)
