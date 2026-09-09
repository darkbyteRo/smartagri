'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { MapPin, Calendar, IndianRupee, Search, Filter, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { ProduceListing } from '@/types';

export default function BrowseListings() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ProduceListing | null>(null);
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Filter state
  const [cropFilter, setCropFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  // Offer form state
  const [offeredPrice, setOfferedPrice] = useState('');
  const [offeredQuantity, setOfferedQuantity] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  const fetchListings = async () => {
    try {
      const res = await api.get('/listings');
      setListings(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load farmer listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleMakeOffer = (listing: ProduceListing) => {
    setSelectedListing(listing);
    setOfferedPrice(listing.expected_price_per_kg ? String(listing.expected_price_per_kg) : '25');
    setOfferedQuantity(String(listing.quantity_kg));
    setOfferMessage('');
    setIsOfferModalOpen(true);
  };

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    const price = parseFloat(offeredPrice);
    const qty = parseFloat(offeredQuantity);

    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid offered price');
      return;
    }
    if (isNaN(qty) || qty <= 0 || qty > selectedListing.quantity_kg) {
      toast.error(`Quantity must be between 1 and ${selectedListing.quantity_kg} kg`);
      return;
    }

    setSubmittingOffer(true);
    try {
      await api.post('/offers', {
        listing_id: selectedListing.id,
        offered_price_per_kg: price,
        quantity_kg: qty,
        message: offerMessage.trim() || undefined,
      });
      toast.success(`Offer of ₹${price}/kg for ${qty}kg submitted successfully!`);
      setIsOfferModalOpen(false);
      setSelectedListing(null);
    } catch (err: any) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to submit offer'));
    } finally {
      setSubmittingOffer(false);
    }
  };

  const cropOptions = useMemo(() => {
    const unique = Array.from(new Set(listings.map((l) => l.crop_name).filter(Boolean))) as string[];
    return [{ label: 'All Crops', value: '' }, ...unique.map((c) => ({ label: c, value: c }))];
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchesCrop = !cropFilter || l.crop_name === cropFilter;
      const matchesGrade = !gradeFilter || l.quality_grade === gradeFilter;
      return matchesCrop && matchesGrade;
    });
  }, [listings, cropFilter, gradeFilter]);

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
          <p className="text-gray-500 mt-1">Direct produce listings posted by verified Telangana farmers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchListings} className="flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Link href="/buyer/offers">
            <Button className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white">
              <FileText className="w-4 h-4" />
              View My Offers
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-1/3">
          <Select
            label="Filter by Crop"
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            options={cropOptions}
          />
        </div>
        <div className="w-full sm:w-1/4">
          <Select
            label="Quality Grade"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            options={[
              { label: 'All Grades', value: '' },
              { label: 'Grade A (Premium)', value: 'A' },
              { label: 'Grade B (Standard)', value: 'B' },
              { label: 'Grade C (Economy)', value: 'C' },
            ]}
          />
        </div>
        <div className="text-sm text-gray-500 pb-2">
          Showing <span className="font-semibold text-gray-800">{filteredListings.length}</span> active listings
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="No Active Listings Found"
          description="There are currently no listings matching your criteria. Check back soon or register a requirement."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-2 bg-emerald-500"></div>
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{listing.crop_name}</h3>
                    <p className="text-sm text-gray-500 font-medium">By {listing.farmer_name || 'Telangana Farmer'}</p>
                  </div>
                  <Badge variant="outline" className="font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                    Grade {listing.quality_grade}
                  </Badge>
                </div>

                <div className="space-y-4 mb-6 flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-500 mb-1">Available Qty</p>
                      <p className="font-semibold text-gray-900">{listing.quantity_kg} kg</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-500 mb-1">Expected Price</p>
                      <p className="font-semibold text-gray-900 flex items-center">
                        <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                        {listing.expected_price_per_kg ? `${listing.expected_price_per_kg}/kg` : 'Negotiable'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    Available: {listing.available_from || listing.harvest_date}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {listing.district_name ? `${listing.district_name}, Telangana` : 'Telangana APMC'}
                  </div>
                </div>

                <div className="mt-auto">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleMakeOffer(listing)}>
                    Make an Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedListing && (
        <Modal
          isOpen={isOfferModalOpen}
          onClose={() => !submittingOffer && setIsOfferModalOpen(false)}
          title="Submit Purchase Offer"
        >
          <div className="mb-4 p-3 bg-blue-50 text-blue-900 text-sm rounded-md border border-blue-200">
            You are making an offer to <strong>{selectedListing.farmer_name}</strong> for{' '}
            <strong>{selectedListing.quantity_kg} kg {selectedListing.crop_name}</strong>.
            {selectedListing.expected_price_per_kg && (
              <> Expected price: <strong>₹{selectedListing.expected_price_per_kg}/kg</strong>.</>
            )}
          </div>
          <form onSubmit={submitOffer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Offer Price (₹/kg)"
                type="number"
                step="0.5"
                min="1"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                icon={<IndianRupee size={16} />}
                required
              />
              <Input
                label="Quantity (kg)"
                type="number"
                min="1"
                max={selectedListing.quantity_kg}
                value={offeredQuantity}
                onChange={(e) => setOfferedQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Message to Farmer (Optional)</label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Specify transport pickup details, immediate payment terms, or quality inspection notes..."
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOfferModalOpen(false)}
                disabled={submittingOffer}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={submittingOffer} className="bg-emerald-600 hover:bg-emerald-700">
                Submit Offer
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

