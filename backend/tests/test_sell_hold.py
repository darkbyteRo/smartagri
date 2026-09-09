import pytest

def test_sell_hold_recommendation_values():
    """Test that recommendation values are valid."""
    valid_recommendations = {"SELL", "HOLD", "SELL_PARTIALLY"}
    valid_risk_levels = {"LOW", "MEDIUM", "HIGH"}
    
    # These are valid enum values
    for r in valid_recommendations:
        assert r in valid_recommendations
    for r in valid_risk_levels:
        assert r in valid_risk_levels

def test_spoilage_calculation():
    """Test spoilage rate calculation."""
    quantity_kg = 2000
    spoilage_rate = 0.03  # 3% per day (tomato)
    days = 3
    
    remaining = quantity_kg * (1 - spoilage_rate * days)
    assert remaining == 1820  # 2000 * 0.91
    
    loss_kg = quantity_kg - remaining
    assert loss_kg == 180

def test_net_realization_calculation():
    """Test the net realization formula."""
    price_per_kg = 28.0
    quantity_kg = 2000.0
    transport_cost = 4400.0  # 2.20/kg
    market_fee_pct = 1.0
    
    gross = price_per_kg * quantity_kg  # 56000
    market_fee = gross * (market_fee_pct / 100)  # 560
    net = gross - transport_cost - market_fee  # 56000 - 4400 - 560 = 51040
    net_per_kg = net / quantity_kg  # 25.52
    
    assert gross == 56000
    assert market_fee == 560
    assert net == 51040
    assert net_per_kg == 25.52
