'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { ShoppingCart, FileText, CheckCircle, Search, TrendingUp, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Demo data for layout
  const stats = {
    activeRequirements: 3,
    pendingOffers: 5,
    completedDeals: 12
  };

  const recentActivity = [
    { id: 1, type: 'offer_accepted', text: 'Farmer accepted your offer for 500kg Tomatoes', time: '2 hours ago', icon: CheckCircle },
    { id: 2, type: 'new_match', text: 'New listing matches your requirement for Onions', time: '5 hours ago', icon: Search },
    { id: 3, type: 'offer_sent', text: 'You made an offer for 1000kg Rice', time: '1 day ago', icon: FileText }
  ];

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name || 'Buyer'}!</h1>
          <p className="text-gray-500 mt-1">Manage your requirements and track offers here.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="px-3 py-1 text-sm">
            Verified Business
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Requirements</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.activeRequirements}</h3>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <ShoppingCart size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Offers</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingOffers}</h3>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <Clock size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Deals</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.completedDeals}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <CheckCircle size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/buyer/requirements" className="block">
              <Button variant="primary" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Post Requirement
              </Button>
            </Link>
            <Link href="/buyer/listings" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                Browse Listings
              </Button>
            </Link>
            <Link href="/buyer/offers" className="block">
              <Button variant="secondary" className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                <FileText className="mr-2 h-4 w-4" />
                View Offers
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className={`mt-0.5 rounded-full p-2 ${
                    activity.type === 'offer_accepted' ? 'bg-emerald-100 text-emerald-600' :
                    activity.type === 'new_match' ? 'bg-blue-100 text-blue-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <activity.icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
