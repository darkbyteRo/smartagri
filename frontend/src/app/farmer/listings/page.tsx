'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProduceListing, Crop } from '@/types';
import { Package, Plus, Calendar, IndianRupee } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function ListingsPage() {
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingListing, setViewingListing] = useState<ProduceListing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedCrop, setSelectedCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  
  const fetchListings = async () => {
    try {
      const response = await api.get('/farmer/listings');
      setListings(response.data || []);
    } catch (error) {
      toast.error('Failed to load listings');
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        await fetchListings();
        const cropsRes = await api.get('/crops');
        setCrops(cropsRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !quantity || !harvestDate) {
      toast.error('Please fill required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/farmer/listings', {
        crop_id: parseInt(selectedCrop),
        quantity_kg: parseFloat(quantity),
        quality_grade: qualityGrade,
        expected_price_per_kg: expectedPrice ? parseFloat(expectedPrice) : undefined,
        harvest_date: harvestDate,
        available_from: new Date().toISOString().split('T')[0]
      });
      toast.success('Listing created successfully');
      setIsModalOpen(false);
      fetchListings();
      
      // Reset form
      setSelectedCrop('');
      setQuantity('');
      setQualityGrade('A');
      setExpectedPrice('');
      setHarvestDate('');
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to create listing'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelListing = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this listing?')) return;
    try {
      await api.patch(`/farmer/listings/${id}/status`, { status: 'CANCELLED' });
      toast.success('Listing cancelled');
      fetchListings();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to cancel listing'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Active</Badge>;
      case 'SOLD': return <Badge variant="default">Sold</Badge>;
      case 'EXPIRED': return <Badge variant="warning">Expired</Badge>;
      case 'CANCELLED': return <Badge variant="error">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500">Manage your crop listings and availability</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Listing
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState 
              icon={<Package className="w-12 h-12 text-gray-300" />}
              title="No Listings Found"
              description="You haven't created any produce listings yet. Create a listing to connect with buyers directly."
              action={
                <Button onClick={() => setIsModalOpen(true)}>Create Your First Listing</Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <Card key={listing.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{listing.crop_name}</h3>
                    <p className="text-sm text-gray-500">Grade {listing.quality_grade} • {listing.quantity_kg} kg</p>
                  </div>
                  {getStatusBadge(listing.status)}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <IndianRupee className="w-4 h-4 mr-2 text-gray-400" />
                    Expected: {listing.expected_price_per_kg ? `₹${listing.expected_price_per_kg}/kg` : 'Negotiable'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    Harvest: {new Date(listing.harvest_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  {listing.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => cancelListing(listing.id)}>
                      Cancel
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewingListing(listing)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Listing">
        <form onSubmit={handleCreateListing} className="space-y-4">
          <Select
            label="Crop"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            options={[
              { value: '', label: 'Select Crop', disabled: true },
              ...crops.map(c => ({ value: c.id.toString(), label: c.name }))
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity (kg)"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <Select
              label="Quality Grade"
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              options={[
                { value: 'A', label: 'Grade A (Premium)' },
                { value: 'B', label: 'Grade B (Standard)' },
                { value: 'C', label: 'Grade C (Economy)' }
              ]}
            />
          </div>
          <Input
            label="Expected Price (₹/kg) - Optional"
            type="number"
            min="1"
            value={expectedPrice}
            onChange={(e) => setExpectedPrice(e.target.value)}
            placeholder="Leave empty to negotiate"
          />
          <Input
            label="Harvest Date"
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>Create Listing</Button>
          </div>
        </form>
      </Modal>
      {/* View Listing Details Modal */}
      {viewingListing && (
        <Modal 
          isOpen={!!viewingListing} 
          onClose={() => setViewingListing(null)} 
          title="Listing Details"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewingListing.crop_name}</h2>
                <p className="text-sm text-gray-500">Grade {viewingListing.quality_grade}</p>
              </div>
              {getStatusBadge(viewingListing.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="text-xs text-gray-500 block">Quantity</span>
                <span className="text-base font-semibold text-gray-900">{viewingListing.quantity_kg.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Expected Price</span>
                <span className="text-base font-semibold text-emerald-700">
                  {viewingListing.expected_price_per_kg ? `₹${viewingListing.expected_price_per_kg}/kg` : 'Negotiable'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Harvest Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {viewingListing.harvest_date ? new Date(viewingListing.harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Est. Total Worth</span>
                <span className="text-base font-semibold text-gray-900">
                  {viewingListing.expected_price_per_kg ? `₹${(viewingListing.expected_price_per_kg * viewingListing.quantity_kg).toLocaleString()}` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t gap-3">
              {viewingListing.status === 'ACTIVE' ? (
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={async () => {
                    await cancelListing(viewingListing.id);
                    setViewingListing(null);
                  }}
                >
                  Cancel Listing
                </Button>
              ) : (
                <div />
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setViewingListing(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
