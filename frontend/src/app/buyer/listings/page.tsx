'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { MapPin, Calendar, IndianRupee, Search, Filter } from 'lucide-react';
import type { ProduceListing, Crop } from '@/types';

// Demo data
const DEMO_LISTINGS: ProduceListing[] = [
  {
    id: 'list_1',
    farmer_id: 'farmer_1',
    farmer_name: 'Ramesh Patel',
    crop_id: 1,
    crop_name: 'Tomatoes',
    quantity_kg: 800,
    quality_grade: 'A',
    expected_price_per_kg: 22,
    harvest_date: '2023-11-10',
    available_from: '2023-11-11',
    status: 'ACTIVE',
    created_at: '2023-11-01'
  },
  {
    id: 'list_2',
    farmer_id: 'farmer_2',
    farmer_name: 'Suresh Kumar',
    crop_id: 2,
    crop_name: 'Onions',
    quantity_kg: 2500,
    quality_grade: 'B',
    expected_price_per_kg: 15,
    harvest_date: '2023-11-05',
    available_from: '2023-11-06',
    status: 'ACTIVE',
    created_at: '2023-11-02'
  }
];

export default function BrowseListings() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ProduceListing | null>(null);
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setListings(DEMO_LISTINGS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleMakeOffer = (listing: ProduceListing) => {
    setSelectedListing(listing);
    setIsOfferModalOpen(true);
  };

  const submitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOffer(true);
    setTimeout(() => {
      setSubmittingOffer(false);
      setIsOfferModalOpen(false);
      setSelectedListing(null);
      // Show success toast here
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Farmer Listings</h1>
          <p className="text-gray-500 mt-1">Find the produce you need directly from farmers.</p>
        </div>
      </div>

      {/* Filters (UI only for demo) */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-1/3">
          <Select 
            label="Crop" 
            options={[{label: 'All Crops', value: ''}, {label: 'Tomatoes', value: '1'}, {label: 'Onions', value: '2'}]} 
          />
        </div>
        <div className="w-full sm:w-1/4">
          <Select 
            label="Quality Grade" 
            options={[{label: 'All Grades', value: ''}, {label: 'Grade A', value: 'A'}, {label: 'Grade B', value: 'B'}]} 
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="No Listings Found"
          description="We couldn't find any listings matching your criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-2 bg-emerald-500"></div>
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{listing.crop_name}</h3>
                    <p className="text-sm text-gray-500 font-medium">By {listing.farmer_name}</p>
                  </div>
                  <Badge variant="outline" className="font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                    Grade {listing.quality_grade}
                  </Badge>
                </div>

                <div className="space-y-4 mb-6 flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-500 mb-1">Quantity</p>
                      <p className="font-semibold text-gray-900">{listing.quantity_kg} kg</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-500 mb-1">Expected Price</p>
                      <p className="font-semibold text-gray-900 flex items-center">
                        <IndianRupee className="h-3 w-3 mr-0.5" />{listing.expected_price_per_kg}/kg
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    Available: {listing.available_from}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    Farmer Location (District)
                  </div>
                </div>

                <div className="mt-auto">
                  <Button className="w-full" onClick={() => handleMakeOffer(listing)}>
                    Make an Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedListing && (
        <Modal isOpen={isOfferModalOpen} onClose={() => !submittingOffer && setIsOfferModalOpen(false)} title="Make an Offer">
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-100">
            You are making an offer for <strong>{selectedListing.quantity_kg}kg {selectedListing.crop_name}</strong>.
            Farmer's expected price is <strong>₹{selectedListing.expected_price_per_kg}/kg</strong>.
          </div>
          <form onSubmit={submitOffer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Offer Price (₹/kg)" 
                type="number" 
                step="0.5" 
                min="1"
                defaultValue={selectedListing.expected_price_per_kg} 
                icon={<IndianRupee size={16} />}
                required 
              />
              <Input 
                label="Quantity (kg)" 
                type="number" 
                min="1" 
                max={selectedListing.quantity_kg}
                defaultValue={selectedListing.quantity_kg} 
                required 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Message (Optional)</label>
              <textarea 
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Any special requests regarding transport or quality check..."
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOfferModalOpen(false)} disabled={submittingOffer}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submittingOffer}>
                Submit Offer
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
