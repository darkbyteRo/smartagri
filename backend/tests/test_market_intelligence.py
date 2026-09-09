import pytest
from app.utils.distance import haversine_distance, estimate_transport_cost

def test_haversine_distance():
    # Hyderabad to Warangal ~145 km
    dist = haversine_distance(17.3850, 78.4867, 17.9689, 79.5941)
    assert 130 < dist < 160, f"Expected ~145km, got {dist}"

def test_haversine_same_point():
    dist = haversine_distance(17.3850, 78.4867, 17.3850, 78.4867)
    assert dist == 0

def test_transport_cost():
    cost = estimate_transport_cost(100, 2000, rate_per_km_per_ton=4.0)
    # 100km * 4.0 * 2 tons = 800
    assert cost == 800

def test_transport_cost_min_charge():
    cost = estimate_transport_cost(1, 10, rate_per_km_per_ton=4.0, min_charge=500)
    assert cost == 500  # min charge applies

def test_transport_cost_zero_distance():
    cost = estimate_transport_cost(0, 2000, rate_per_km_per_ton=4.0, min_charge=500)
    assert cost == 500  # min charge
