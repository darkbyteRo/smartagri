'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Plus, Eye, BarChart2, Package, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { FarmerDashboard as DashboardData } from '@/types';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/farmer/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.full_name || 'Farmer'}! 👋
          </h1>
          <p className="text-gray-500">
            {data?.farmer?.district_name ? `${data.farmer.district_name}, ` : ''}
            {data?.farmer?.village || 'Telangana'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/farmer/listings" passHref>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/farmer/compare-markets" passHref>
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
                <BarChart2 className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Compare Markets</h3>
                <p className="text-xs text-gray-500 hidden sm:block">Find the best price for your crop</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/farmer/listings" passHref>
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                <Package className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Listings</h3>
                <p className="text-xs text-gray-500 hidden sm:block">Manage your crops for sale</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/farmer/buyers" passHref>
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-amber-100 rounded-full text-amber-600">
                <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Offers</h3>
                <p className="text-xs text-gray-500 hidden sm:block">Check buyer requests and offers</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer h-full" onClick={() => {
            const chatBtn = document.querySelector('button[aria-label="Open AI Assistant"]') as HTMLButtonElement;
            if (chatBtn) chatBtn.click();
          }}>
          <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
            <div className="p-4 bg-purple-100 rounded-full text-purple-600">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-xs text-gray-500 hidden sm:block">Ask agricultural questions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.active_listings && data.active_listings.length > 0 ? (
              <div className="space-y-4">
                {data.active_listings.slice(0, 3).map((listing) => (
                  <div key={listing.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-gray-900">{listing.crop_name}</p>
                      <p className="text-sm text-gray-500">{listing.quantity_kg} kg • Grade {listing.quality_grade}</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<Package className="w-8 h-8" />} 
                title="No Active Listings" 
                description="Create a listing to connect with buyers." 
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.pending_offers && data.pending_offers.length > 0 ? (
              <div className="space-y-4">
                {data.pending_offers.slice(0, 3).map((offer) => (
                  <div key={offer.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-gray-900">{offer.buyer_name || 'Buyer'}</p>
                      <p className="text-sm text-gray-500">₹{offer.offered_price_per_kg}/kg for {offer.quantity_kg} kg</p>
                    </div>
                    <Link href="/farmer/buyers" passHref>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<Users className="w-8 h-8" />} 
                title="No Pending Offers" 
                description="You don't have any pending offers from buyers." 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
