'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BuyerOffer } from '@/types';
import { Users, ShieldCheck, MessageCircle, Check, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

export default function BuyersPage() {
  const [offers, setOffers] = useState<BuyerOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      const response = await api.get('/farmer/offers');
      setOffers(response.data || []);
    } catch (error) {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOfferAction = async (offerId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      await api.patch(`/farmer/offers/${offerId}`, { action });
      toast.success(`Offer ${action.toLowerCase()}ed successfully`);
      fetchOffers();
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to ${action.toLowerCase()} offer`));
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 4.5) return 'text-emerald-600 bg-emerald-50';
    if (score >= 3.5) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buyer Offers</h1>
        <p className="text-gray-500">Review and respond to purchase offers for your listings</p>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState 
              icon={<Users className="w-12 h-12 text-gray-300" />}
              title="No Offers Yet"
              description="When buyers send offers for your listings, they will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map(offer => (
            <Card key={offer.id} className={offer.status === 'PENDING' ? 'border-amber-200 shadow-sm' : ''}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{offer.buyer_business || offer.buyer_name}</h3>
                      {offer.buyer_verified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    {offer.buyer_reliability && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getReliabilityColor(offer.buyer_reliability)}`}>
                        ★ {offer.buyer_reliability.toFixed(1)} Rating
                      </span>
                    )}
                  </div>
                  <Badge variant={offer.status === 'PENDING' ? 'warning' : offer.status === 'ACCEPTED' ? 'success' : 'default'}>
                    {offer.status}
                  </Badge>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Offered Price</p>
                      <p className="text-xl font-bold text-gray-900">₹{offer.offered_price_per_kg}/kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quantity Requested</p>
                      <p className="text-xl font-bold text-gray-900">{offer.quantity_kg} kg</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">For Listing:</p>
                    <p className="text-sm font-medium">{offer.listing?.crop_name || 'Crop'} - {offer.listing?.quantity_kg}kg Available</p>
                  </div>
                </div>

                {offer.message && (
                  <div className="mb-4 flex items-start gap-2 text-sm text-gray-600 bg-emerald-50/50 p-3 rounded-md border border-emerald-100">
                    <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p>"{offer.message}"</p>
                  </div>
                )}

                {offer.status === 'PENDING' && (
                  <div className="flex gap-3 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                      onClick={() => handleOfferAction(offer.id, 'REJECT')}
                    >
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => handleOfferAction(offer.id, 'ACCEPT')}
                    >
                      <Check className="w-4 h-4 mr-2" /> Accept Offer
                    </Button>
                  </div>
                )}
                
                {offer.status === 'ACCEPTED' && (
                  <Button variant="secondary" className="w-full mt-2">
                    View Transaction Details
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
