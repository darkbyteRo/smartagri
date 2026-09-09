import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km using Haversine formula."""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def estimate_transport_cost(distance_km: float, quantity_kg: float, rate_per_km_per_ton: float = 4.0, min_charge: float = 500.0) -> float:
    """Estimate transport cost. Rate is per km per ton."""
    quantity_tons = quantity_kg / 1000
    cost = distance_km * rate_per_km_per_ton * quantity_tons
    return max(cost, min_charge)

def estimate_travel_time_hours(distance_km: float, avg_speed_kmh: float = 35.0) -> float:
    """Estimate travel time assuming rural Indian road speeds."""
    return distance_km / avg_speed_kmh
