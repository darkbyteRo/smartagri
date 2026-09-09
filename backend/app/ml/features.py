import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.price import MarketPrice
from datetime import date, timedelta

def get_price_history_df(db: Session, crop_id: int, market_id: int, days: int = 90) -> pd.DataFrame:
    """Fetch historical prices and return as DataFrame."""
    cutoff = date.today() - timedelta(days=days)
    prices = db.query(MarketPrice).filter(
        MarketPrice.crop_id == crop_id,
        MarketPrice.market_id == market_id,
        MarketPrice.price_date >= cutoff
    ).order_by(MarketPrice.price_date.asc()).all()
    
    if not prices:
        return pd.DataFrame()
    
    data = [{
        'date': p.price_date,
        'modal_price': p.modal_price,
        'min_price': p.min_price,
        'max_price': p.max_price,
        'arrival_qty': p.arrival_qty or 0,
    } for p in prices]
    
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    return df

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add ML features to the price dataframe."""
    if df.empty:
        return df
    
    df = df.sort_values('date').copy()
    
    # Time features
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
    
    # Lag features
    for lag in [1, 2, 3, 5, 7]:
        df[f'price_lag_{lag}'] = df['modal_price'].shift(lag)
    
    # Rolling statistics
    for window in [3, 7, 14]:
        df[f'price_ma_{window}'] = df['modal_price'].rolling(window=window).mean()
        df[f'price_std_{window}'] = df['modal_price'].rolling(window=window).std()
    
    # Price change features
    df['price_change_1d'] = df['modal_price'].diff(1)
    df['price_change_7d'] = df['modal_price'].diff(7)
    df['price_pct_change_1d'] = df['modal_price'].pct_change(1)
    
    # Volatility
    df['volatility_7d'] = df['modal_price'].rolling(window=7).std() / df['modal_price'].rolling(window=7).mean()
    
    # Price spread
    df['price_spread'] = df['max_price'] - df['min_price']
    
    # Arrival quantity features
    df['arrival_ma_7'] = df['arrival_qty'].rolling(window=7).mean()
    
    # Target: next day's modal price
    df['target'] = df['modal_price'].shift(-1)
    
    return df

def get_feature_columns() -> list[str]:
    """Return the list of feature column names for the model."""
    return [
        'day_of_week', 'day_of_month', 'month', 'week_of_year',
        'price_lag_1', 'price_lag_2', 'price_lag_3', 'price_lag_5', 'price_lag_7',
        'price_ma_3', 'price_ma_7', 'price_ma_14',
        'price_std_3', 'price_std_7', 'price_std_14',
        'price_change_1d', 'price_change_7d', 'price_pct_change_1d',
        'volatility_7d', 'price_spread', 'arrival_qty', 'arrival_ma_7',
    ]
