'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Clock, CheckCircle, XCircle, ExternalLink, IndianRupee } from 'lucide-react';
import type { BuyerOffer } from '@/types';

// Demo data
const DEMO_OFFERS: BuyerOffer[] = [
  {
    id: 'offer_1',
    buyer_id: 'buyer_1',
    listing_id: 'list_1',
    listing: {
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
    offered_price_per_kg: 20,
    quantity_kg: 800,
    status: 'PENDING',
    created_at: '2023-11-02T10:00:00Z'
  },
  {
    id: 'offer_2',
    buyer_id: 'buyer_1',
    listing_id: 'list_2',
    listing: {
      id: 'list_2',
      farmer_id: 'farmer_2',
      farmer_name: 'Suresh Kumar',
      crop_id: 2,
      crop_name: 'Onions',
      quantity_kg: 2000,
      quality_grade: 'B',
      expected_price_per_kg: 15,
      harvest_date: '2023-11-05',
      available_from: '2023-11-06',
      status: 'SOLD',
      created_at: '2023-11-01'
    },
    offered_price_per_kg: 15,
    quantity_kg: 2000,
    status: 'ACCEPTED',
    created_at: '2023-11-01T14:30:00Z'
  }
];

export default function BuyerOffers() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<BuyerOffer[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffers(DEMO_OFFERS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning"><Clock className="w-3 h-3 mr-1 inline" />Pending</Badge>;
      case 'ACCEPTED': return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" />Accepted</Badge>;
      case 'REJECTED': return <Badge variant="error"><XCircle className="w-3 h-3 mr-1 inline" />Rejected</Badge>;
      case 'WITHDRAWN': return <Badge variant="outline">Withdrawn</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleWithdraw = (offerId: string) => {
    // Demo implementation
    setOffers(offers.map(o => o.id === offerId ? { ...o, status: 'WITHDRAWN' } : o));
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
          <h1 className="text-2xl font-bold text-gray-900">My Offers</h1>
          <p className="text-gray-500 mt-1">Track the status of offers you've made to farmers.</p>
        </div>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No Offers Found"
          description="You haven't made any offers yet. Browse listings to find produce."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{offer.listing?.crop_name}</h3>
                      {getStatusBadge(offer.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Farmer: <span className="font-medium text-gray-800">{offer.listing?.farmer_name}</span></p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Offered Price</p>
                        <p className="font-semibold text-gray-900 flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5" />{offer.offered_price_per_kg}/kg
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quantity</p>
                        <p className="font-semibold text-gray-900">{offer.quantity_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Value</p>
                        <p className="font-semibold text-emerald-700 flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5" />
                          {(offer.offered_price_per_kg * offer.quantity_kg).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(offer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {offer.status === 'PENDING' && (
                      <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleWithdraw(offer.id)}>
                        Withdraw Offer
                      </Button>
                    )}
                    {offer.status === 'ACCEPTED' && (
                      <Button variant="primary" className="w-full">
                        View Transaction <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
