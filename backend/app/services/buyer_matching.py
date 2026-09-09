from sqlalchemy.orm import Session
from app.models.buyer import BuyerRequirement, Buyer, RequirementStatus
from app.models.listing import ProduceListing, ListingStatus
import math
import uuid

def _to_uuid(val):
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return val

class BuyerMatchingEngine:
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        # Haversine formula
        R = 6371.0 # Earth radius in km
        lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
        lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
        dlon = lon2_rad - lon1_rad
        dlat = lat2_rad - lat1_rad
        a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        return distance

    def _grade_value(self, grade: str) -> int:
        if not grade:
            return 0
        grade = grade.upper()
        if grade == 'A':
            return 3
        if grade == 'B':
            return 2
        if grade == 'C':
            return 1
        return 0

    def find_matching_buyers(self, listing_id: str, farmer_lat: float, farmer_lon: float) -> list[dict]:
        """Find and rank buyers for a listing."""
        listing = self.db.query(ProduceListing).filter(ProduceListing.id == _to_uuid(listing_id)).first()
        if not listing:
            return []

        # Find active requirements for the same crop
        requirements = self.db.query(BuyerRequirement).join(Buyer).filter(
            BuyerRequirement.crop_id == listing.crop_id,
            BuyerRequirement.status == RequirementStatus.ACTIVE
        ).all()

        results = []
        for req in requirements:
            buyer = req.buyer
            # Note: assuming district has lat/lon
            buyer_district = buyer.district
            buyer_lat = buyer_district.latitude if buyer_district else 0.0
            buyer_lon = buyer_district.longitude if buyer_district else 0.0

            # crop_compatibility (0.25)
            crop_score = 1.0

            # quantity_compatibility (0.20)
            if req.quantity_kg_min <= listing.quantity_kg <= req.quantity_kg_max:
                quantity_score = 1.0
            else:
                # partial score
                if listing.quantity_kg < req.quantity_kg_min:
                    quantity_score = max(0.0, listing.quantity_kg / req.quantity_kg_min)
                else:
                    quantity_score = max(0.0, req.quantity_kg_max / listing.quantity_kg)

            # quality_compatibility (0.15)
            q_list = self._grade_value(listing.quality_grade)
            q_req = self._grade_value(req.quality_grade_min) if req.quality_grade_min else 0
            quality_score = 1.0 if q_list >= q_req else 0.0

            # price_attractiveness (0.15)
            price_score = 0.0
            if req.max_price_per_kg and listing.expected_price_per_kg:
                price_score = min(1.0, req.max_price_per_kg / listing.expected_price_per_kg)
            elif not listing.expected_price_per_kg:
                price_score = 1.0

            # distance (0.10)
            distance = self.calculate_distance(farmer_lat, farmer_lon, buyer_lat, buyer_lon)
            max_distance = 300.0
            distance_score = max(0.0, 1.0 - (distance / max_distance))

            # reliability (0.15)
            rel_score = (buyer.reliability_score / 100.0) * 0.7 + (0.3 if buyer.is_verified else 0.0)

            total_score = (
                crop_score * 0.25 +
                quantity_score * 0.20 +
                quality_score * 0.15 +
                price_score * 0.15 +
                distance_score * 0.10 +
                rel_score * 0.15
            )

            results.append({
                "buyer_id": buyer.id,
                "buyer_business_name": buyer.business_name,
                "buyer_verified": buyer.is_verified,
                "buyer_reliability_score": buyer.reliability_score,
                "match_score": total_score,
                "score_breakdown": {
                    "crop_compatibility": crop_score,
                    "quantity_compatibility": quantity_score,
                    "quality_compatibility": quality_score,
                    "price_attractiveness": price_score,
                    "distance": distance_score,
                    "reliability": rel_score
                }
            })

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results
    
    def find_matching_listings(self, buyer_id: str) -> list[dict]:
        """Find matching farmer listings for a buyer's requirements."""
        requirements = self.db.query(BuyerRequirement).filter(
            BuyerRequirement.buyer_id == _to_uuid(buyer_id),
            BuyerRequirement.status == RequirementStatus.ACTIVE
        ).all()
        
        matches = []
        for req in requirements:
            listings = self.db.query(ProduceListing).filter(
                ProduceListing.crop_id == req.crop_id,
                ProduceListing.status == ListingStatus.ACTIVE,
                ProduceListing.quantity_kg >= req.quantity_kg_min
            ).all()
            for listing in listings:
                matches.append({
                    "requirement_id": req.id,
                    "listing_id": listing.id,
                    "farmer_id": listing.farmer_id
                })
        return matches
