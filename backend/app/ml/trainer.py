import xgboost as xgb
import numpy as np
import json
import os
import pickle
from datetime import datetime
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from app.ml.features import engineer_features, get_feature_columns, get_price_history_df
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

def get_model_path(crop_id: int, market_id: int) -> str:
    return os.path.join(MODEL_DIR, f'price_model_{crop_id}_{market_id}.pkl')

def get_metadata_path(crop_id: int, market_id: int) -> str:
    return os.path.join(MODEL_DIR, f'price_model_{crop_id}_{market_id}_meta.json')

def train_model(db: Session, crop_id: int, market_id: int, days: int = 90) -> dict:
    """Train XGBoost model for a specific crop-market combination.
    
    Returns training metadata including metrics.
    """
    # Get data
    df = get_price_history_df(db, crop_id, market_id, days)
    if len(df) < 30:
        return {"success": False, "error": "Insufficient data", "rows": len(df), "minimum_required": 30}
    
    # Engineer features
    df = engineer_features(df)
    feature_cols = get_feature_columns()
    
    # Drop rows with NaN (from lags/rolling)
    df_clean = df.dropna(subset=feature_cols + ['target'])
    if len(df_clean) < 20:
        return {"success": False, "error": "Insufficient data after feature engineering", "rows": len(df_clean)}
    
    X = df_clean[feature_cols].values
    y = df_clean['target'].values
    
    # Time series split for validation
    tscv = TimeSeriesSplit(n_splits=3)
    mae_scores = []
    
    for train_idx, val_idx in tscv.split(X):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        
        model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbosity=0
        )
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
        y_pred = model.predict(X_val)
        mae_scores.append(mean_absolute_error(y_val, y_pred))
    
    # Train final model on all data
    final_model = xgb.XGBRegressor(
        n_estimators=100, max_depth=4, learning_rate=0.1,
        subsample=0.8, colsample_bytree=0.8, random_state=42, verbosity=0
    )
    final_model.fit(X, y)
    y_pred_all = final_model.predict(X)
    
    # Metrics
    metrics = {
        "mae": float(np.mean(mae_scores)),
        "rmse": float(np.sqrt(mean_squared_error(y, y_pred_all))),
        "r2": float(r2_score(y, y_pred_all)),
        "cv_mae_scores": [float(s) for s in mae_scores],
    }
    
    # Save model
    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(get_model_path(crop_id, market_id), 'wb') as f:
        pickle.dump(final_model, f)
    
    # Save metadata
    metadata = {
        "crop_id": crop_id,
        "market_id": market_id,
        "trained_at": datetime.now().isoformat(),
        "training_samples": len(df_clean),
        "feature_columns": feature_cols,
        "metrics": metrics,
        "model_version": "xgboost_v1",
        "data_source": "historical_prices",
    }
    with open(get_metadata_path(crop_id, market_id), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Trained model for crop={crop_id} market={market_id}: MAE={metrics['mae']:.2f}")
    return {"success": True, "metrics": metrics, "metadata": metadata}

def train_all_models(db: Session) -> list[dict]:
    """Train models for all crop-market combinations that have sufficient data."""
    from app.models.crop import Crop
    from app.models.market import Market
    
    crops = db.query(Crop).filter(Crop.is_active == True).all()
    markets = db.query(Market).filter(Market.is_active == True).all()
    
    results = []
    for crop in crops:
        for market in markets:
            result = train_model(db, crop.id, market.id)
            result["crop_name"] = crop.name
            result["market_name"] = market.name
            results.append(result)
    
    return results
