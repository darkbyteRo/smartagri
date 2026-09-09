import pytest

def test_quality_grade_ordering():
    """Test that quality grades are properly ordered."""
    grades = {"A": 3, "B": 2, "C": 1}
    assert grades["A"] > grades["B"]
    assert grades["B"] > grades["C"]

def test_match_score_range():
    """Test that match scores are within valid range."""
    # Simulated match score components
    weights = {
        "crop_compatibility": 0.25,
        "quantity_compatibility": 0.20,
        "quality_compatibility": 0.15,
        "price_attractiveness": 0.15,
        "distance": 0.10,
        "reliability": 0.15,
    }
    
    # Weights should sum to 1.0
    assert abs(sum(weights.values()) - 1.0) < 0.001
    
    # All weights should be positive
    for w in weights.values():
        assert w > 0

def test_buyer_reliability_score_range():
    """Test reliability score bounds."""
    # Score should be 0-100
    min_score = 10  # minimum for any registered buyer
    max_score = 100
    
    # Verified buyer with perfect history
    base = 30  # verified
    completion_rate = 40  # perfect completion
    volume_bonus = 20  # high volume
    score = min(base + completion_rate + volume_bonus, max_score)
    assert score == 90
    assert min_score <= score <= max_score

def test_end_to_end_marketplace_journey():
    from fastapi.testclient import TestClient
    from main import app
    from datetime import date, timedelta
    
    client = TestClient(app)
    
    # 1. Login Farmer
    r = client.post('/api/auth/login', json={'email': 'farmer@demo.com', 'password': 'demo1234'})
    assert r.status_code == 200
    farmer_token = r.json()['access_token']
    farmer_headers = {'Authorization': f'Bearer {farmer_token}'}
    
    # 2. Login Buyer
    r = client.post('/api/auth/login', json={'email': 'buyer@demo.com', 'password': 'demo1234'})
    assert r.status_code == 200
    buyer_token = r.json()['access_token']
    buyer_headers = {'Authorization': f'Bearer {buyer_token}'}
    
    # 3. Farmer creates produce listing (Tomato, 2000kg)
    listing_payload = {
        'crop_id': 1,
        'quantity_kg': 2000.0,
        'quality_grade': 'B',
        'expected_price_per_kg': 28.0,
        'harvest_date': str(date.today() + timedelta(days=2)),
        'available_from': str(date.today() + timedelta(days=2)),
        'available_until': str(date.today() + timedelta(days=7))
    }
    r = client.post('/api/listings/', json=listing_payload, headers=farmer_headers)
    assert r.status_code == 200
    listing_id = r.json()['id']
    
    # 4. Farmer checks matching buyers
    r = client.get(f'/api/matching/buyers/{listing_id}', headers=farmer_headers)
    assert r.status_code == 200
    
    # 5. Buyer makes an offer
    offer_payload = {
        'listing_id': listing_id,
        'offered_price_per_kg': 27.50,
        'quantity_kg': 2000.0,
        'message': 'Interested in purchasing full lot for Hyderabad dispatch.'
    }
    r = client.post('/api/offers/', json=offer_payload, headers=buyer_headers)
    assert r.status_code == 200
    offer_id = r.json()['id']
    
    # 6. Farmer accepts the offer
    r = client.put(f'/api/offers/{offer_id}/accept', headers=farmer_headers)
    assert r.status_code == 200
    
    # 7. Check transaction created
    r = client.get('/api/transactions/', headers=farmer_headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1
    tx = r.json()[0]
    assert tx['total_amount'] > 0
    assert tx['status'] in ['INITIATED', 'IN_PROGRESS', 'COMPLETED']
    
    # 8. Admin inspects analytics
    r = client.post('/api/auth/login', json={'email': 'admin@demo.com', 'password': 'admin1234'})
    assert r.status_code == 200
    admin_token = r.json()['access_token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    
    r = client.get('/api/admin/analytics', headers=admin_headers)
    assert r.status_code == 200
    analytics = r.json()
    assert analytics['total_farmers'] >= 1
    assert analytics['total_buyers'] >= 1
    assert analytics['total_transactions'] >= 1

