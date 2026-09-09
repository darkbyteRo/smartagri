from sqlalchemy.orm import Session
from app.ml.predictor import PricePredictor
from app.ml.trainer import train_model, train_all_models
from app.models.prediction import PricePrediction
from datetime import date
import logging

logger = logging.getLogger(__name__)

class PricePredictionService:
    def __init__(self, db: Session):
        self.db = db
        self.predictor = PricePredictor(db)
    
    def get_predictions(self, crop_id: int, market_id: int, days: int = 7) -> list[dict]:
        """Get price predictions and store them in the database."""
        predictions = self.predictor.predict_range(crop_id, market_id, days)
        
        # Store predictions in database
        for pred in predictions:
            if pred and 'crop_id' in pred:
                db_pred = PricePrediction(
                    crop_id=pred['crop_id'],
                    market_id=pred['market_id'],
                    prediction_date=date.fromisoformat(pred['prediction_date']),
                    target_date=date.fromisoformat(pred['target_date']),
                    predicted_price=pred['predicted_price'],
                    confidence=pred['confidence'],
                    error_margin=pred['error_margin'],
                    model_version=pred.get('model_version', 'unknown'),
                    data_source=pred.get('data_source', 'unknown'),
                )
                self.db.add(db_pred)
        
        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to store predictions: {e}")
        
        return predictions
    
    def train(self, crop_id: int, market_id: int) -> dict:
        """Train model for a specific crop-market pair."""
        return train_model(self.db, crop_id, market_id)
    
    def train_all(self) -> list[dict]:
        """Train models for all combinations."""
        return train_all_models(self.db)
