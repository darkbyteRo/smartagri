'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Clock, CheckCircle, XCircle, ExternalLink, IndianRupee, RefreshCw, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { BuyerOffer } from '@/types';

export default function BuyerOffers() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<BuyerOffer[]>([]);

  const fetchOffers = async () => {
    try {
      const res = await api.get('/offers');
      setOffers(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1 inline" />
            Pending Review
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            Accepted by Farmer
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="error">
            <XCircle className="w-3 h-3 mr-1 inline" />
            Declined
          </Badge>
        );
      case 'WITHDRAWN':
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">My Purchase Offers</h1>
          <p className="text-gray-500 mt-1">Track the live status of offers you've submitted to farmers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchOffers} className="flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Link href="/buyer/listings">
            <Button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <ShoppingBag className="w-4 h-4" />
              Browse More Listings
            </Button>
          </Link>
        </div>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No Purchase Offers Yet"
          description="You haven't submitted any offers to farmers yet. Browse farmer produce listings and make an offer."
          action={
            <Link href="/buyer/listings">
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                Browse Farmer Listings
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {offers.map((offer) => {
            const cropName = offer.listing?.crop_name || 'Produce';
            const farmerName = offer.listing?.farmer_name || 'Farmer';
            const total = offer.offered_price_per_kg * offer.quantity_kg;

            return (
              <Card key={offer.id} className={offer.status === 'ACCEPTED' ? 'border-emerald-300 shadow-sm bg-emerald-50/10' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{cropName}</h3>
                        {getStatusBadge(offer.status)}
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Farmer: <span className="font-semibold text-gray-800">{farmerName}</span>
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">Offered Rate</p>
                          <p className="font-bold text-gray-900 flex items-center mt-0.5">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                            {offer.offered_price_per_kg}/kg
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="font-bold text-gray-900 mt-0.5">{offer.quantity_kg} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Commitment</p>
                          <p className="font-bold text-emerald-700 flex items-center mt-0.5">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                            {total.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="font-medium text-gray-700 mt-0.5">
                            {offer.created_at ? offer.created_at.split('T')[0] : 'Today'}
                          </p>
                        </div>
                      </div>

                      {offer.message && (
                        <p className="mt-3 text-xs text-gray-600 italic bg-white p-2.5 rounded border border-gray-200">
                          Note to farmer: "{offer.message}"
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
