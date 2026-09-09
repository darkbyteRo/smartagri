import os
import pickle
import json
import numpy as np
import pandas as pd
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.ml.features import get_price_history_df, engineer_features, get_feature_columns
from app.ml.trainer import get_model_path, get_metadata_path
import logging

logger = logging.getLogger(__name__)

class PricePredictor:
    def __init__(self, db: Session):
        self.db = db
    
    def _load_model(self, crop_id: int, market_id: int):
        """Load trained model and metadata."""
        model_path = get_model_path(crop_id, market_id)
        meta_path = get_metadata_path(crop_id, market_id)
        
        if not os.path.exists(model_path) or not os.path.exists(meta_path):
            return None, None
        
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        with open(meta_path, 'r') as f:
            metadata = json.load(f)
        
        return model, metadata
    
    def _statistical_fallback(self, crop_id: int, market_id: int, days_ahead: int) -> dict:
        """Fallback prediction using simple moving average when ML model unavailable."""
        df = get_price_history_df(self.db, crop_id, market_id, days=30)
        if df.empty:
            return None
        
        recent = df.tail(7)
        avg_price = float(recent['modal_price'].mean())
        std_price = float(recent['modal_price'].std()) if len(recent) > 1 else avg_price * 0.05
        
        # Simple trend extrapolation
        if len(recent) >= 3:
            trend = (recent['modal_price'].iloc[-1] - recent['modal_price'].iloc[0]) / len(recent)
            predicted = avg_price + trend * days_ahead
        else:
            predicted = avg_price
        
        return {
            "predicted_price": round(float(predicted), 2),
            "confidence": 0.3,  # low confidence for statistical fallback
            "error_margin": round(float(std_price * 2), 2),
            "model_version": "statistical_fallback",
            "data_source": "moving_average",
            "warning": "Prediction based on simple statistical model due to insufficient training data. Low confidence."
        }
    
    def predict(self, crop_id: int, market_id: int, days_ahead: int = 1) -> dict:
        """Predict price for a crop at a market, days_ahead days from now.
        
        Returns prediction with confidence and error margin.
        Falls back to statistical baseline if ML model unavailable.
        """
        if days_ahead < 1 or days_ahead > 7:
            raise ValueError("days_ahead must be between 1 and 7")
        
        model, metadata = self._load_model(crop_id, market_id)
        
        if model is None:
            logger.warning(f"No trained model for crop={crop_id} market={market_id}, using fallback")
            return self._statistical_fallback(crop_id, market_id, days_ahead)
        
        # Get recent data for feature engineering
        df = get_price_history_df(self.db, crop_id, market_id, days=90)
        if df.empty:
            return None
        
        df = engineer_features(df)
        feature_cols = get_feature_columns()
        
        # Get the last row with valid features
        df_valid = df.dropna(subset=feature_cols)
        if df_valid.empty:
            return self._statistical_fallback(crop_id, market_id, days_ahead)
        
        # For multi-day predictions, iteratively predict
        last_row = df_valid.iloc[-1:].copy()
        current_prediction = None
        
        for step in range(days_ahead):
            X = last_row[feature_cols].values
            pred = float(model.predict(X)[0])
            current_prediction = pred
            
            # Update lag features for next step (simplified)
            if step < days_ahead - 1:
                last_row['price_lag_1'] = pred
                last_row['modal_price'] = pred
        
        # Calculate confidence based on model metrics and prediction horizon
        base_mae = metadata.get('metrics', {}).get('mae', 5.0)
        base_confidence = max(0.3, min(0.95, 1.0 - (base_mae / current_prediction) if current_prediction > 0 else 0.5))
        # Reduce confidence for further-out predictions
        horizon_penalty = 0.05 * (days_ahead - 1)
        confidence = max(0.2, base_confidence - horizon_penalty)
        
        error_margin = base_mae * (1 + 0.3 * (days_ahead - 1))  # error grows with horizon
        
        target_date = date.today() + timedelta(days=days_ahead)
        
        return {
            "crop_id": crop_id,
            "market_id": market_id,
            "prediction_date": str(date.today()),
            "target_date": str(target_date),
            "predicted_price": round(current_prediction, 2),
            "confidence": round(confidence, 2),
            "error_margin": round(error_margin, 2),
            "model_version": metadata.get('model_version', 'unknown'),
            "data_source": metadata.get('data_source', 'unknown'),
        }
    
    def predict_range(self, crop_id: int, market_id: int, days: int = 7) -> list[dict]:
        """Predict prices for 1 to N days ahead."""
        predictions = []
        for d in range(1, min(days + 1, 8)):
            pred = self.predict(crop_id, market_id, d)
            if pred:
                predictions.append(pred)
        return predictions
