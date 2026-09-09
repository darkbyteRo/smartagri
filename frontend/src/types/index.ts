// User & Auth
export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  // Farmer fields
  district_id?: number;
  village?: string;
  // Buyer fields
  business_name?: string;
  business_type?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Geography
export interface State {
  id: number;
  name: string;
  code: string;
}

export interface District {
  id: number;
  name: string;
  state_id: number;
  latitude: number;
  longitude: number;
}

// Crops
export interface Crop {
  id: number;
  name: string;
  name_telugu?: string;
  category?: string;
  unit: string;
  avg_shelf_life_days?: number;
  spoilage_rate_per_day?: number;
}

// Markets
export interface Market {
  id: number;
  name: string;
  name_telugu?: string;
  district_id: number;
  district_name?: string;
  latitude: number;
  longitude: number;
  market_type: 'APMC' | 'PRIVATE' | 'ENAM';
  market_fee_percent: number;
}

export interface MarketPrice {
  id: number;
  crop_id: number;
  market_id: number;
  crop_name?: string;
  market_name?: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  price_date: string;
  source: string;
  arrival_qty?: number;
}

// Market Intelligence
export interface MarketComparisonRequest {
  crop_id: number;
  quantity_kg: number;
  farmer_latitude: number;
  farmer_longitude: number;
  quality_grade?: string;
}

export interface MarketComparison {
  market: Market;
  current_price: MarketPrice;
  distance_km: number;
  transport_cost: number;
  market_fee: number;
  gross_revenue: number;
  net_realization: number;
  net_per_kg: number;
  demand_level: 'LOW' | 'MEDIUM' | 'HIGH';
  rank: number;
}

// Price Prediction
export interface PricePrediction {
  crop_id: number;
  market_id: number;
  target_date: string;
  predicted_price: number;
  confidence: number;
  error_margin: number;
  model_version: string;
  data_source: string;
}

// Sell/Hold Recommendation
export interface SellHoldRequest {
  crop_id: number;
  quantity_kg: number;
  farmer_latitude: number;
  farmer_longitude: number;
  quality_grade?: string;
  harvest_date?: string;
}

export interface SellHoldRecommendation {
  recommendation: 'SELL' | 'HOLD' | 'SELL_PARTIALLY';
  current_best_price: number;
  predicted_future_price?: number;
  expected_benefit?: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  explanation: string;
  best_market: MarketComparison;
  market_comparisons: MarketComparison[];
  price_predictions?: PricePrediction[];
}

// Farmer
export interface Farmer {
  id: string;
  user_id: string;
  district_id: number;
  district_name?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  land_area_acres?: number;
}

export interface FarmerDashboard {
  farmer: Farmer;
  active_listings: ProduceListing[];
  recent_recommendations: SellHoldRecommendation[];
  pending_offers: BuyerOffer[];
  recent_transactions: Transaction[];
}

// Buyer
export interface Buyer {
  id: string;
  user_id: string;
  district_id: number;
  business_name?: string;
  business_type?: string;
  is_verified: boolean;
  reliability_score: number;
  completed_transactions: number;
  cancelled_transactions: number;
}

export interface BuyerRequirement {
  id: string;
  buyer_id: string;
  crop_id: number;
  crop_name?: string;
  quantity_kg_min: number;
  quantity_kg_max: number;
  quality_grade_min?: string;
  max_price_per_kg?: number;
  preferred_district_id?: number;
  needed_by?: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED';
}

// Listings
export interface ProduceListing {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  crop_id: number;
  crop_name?: string;
  quantity_kg: number;
  quality_grade: string;
  expected_price_per_kg?: number;
  harvest_date: string;
  available_from: string;
  available_until?: string;
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
}

// Offers
export interface BuyerOffer {
  id: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_business?: string;
  buyer_verified?: boolean;
  buyer_reliability?: number;
  listing_id: string;
  listing?: ProduceListing;
  offered_price_per_kg: number;
  quantity_kg: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  created_at: string;
}

// Transactions
export interface Transaction {
  id: string;
  offer_id: string;
  farmer_id: string;
  buyer_id: string;
  crop_id: number;
  crop_name?: string;
  buyer_name?: string;
  quantity_kg: number;
  agreed_price_per_kg: number;
  total_amount: number;
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  completed_at?: string;
  created_at: string;
}

// AI Assistant
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: any;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
