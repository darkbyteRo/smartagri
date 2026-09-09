from app.models.buyer import Buyer

class BuyerReliabilityEngine:
    def calculate_score(self, buyer: Buyer) -> float:
        """Calculate buyer reliability score (0-100)."""
        score = 10.0 # Minimum score
        
        if buyer.is_verified:
            score += 30.0
            
        total_tx = buyer.completed_transactions + buyer.cancelled_transactions
        if total_tx > 0:
            completion_rate = buyer.completed_transactions / total_tx
            score += (completion_rate * 40.0)
            
            # Volume bonus
            bonus = min(20.0, buyer.completed_transactions * 2.0)
            score += bonus
            
        # Penalties
        score -= (buyer.cancelled_transactions * 5.0)
        
        return max(10.0, min(100.0, score))
