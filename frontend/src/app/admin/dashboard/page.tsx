'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Users, UserCheck, Store, IndianRupee, History, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  // Demo stats
  const stats = [
    { name: 'Total Farmers', value: '1,240', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', href: '/admin/farmers' },
    { name: 'Total Buyers', value: '350', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', href: '/admin/buyers' },
    { name: 'Active Listings', value: '842', icon: Store, color: 'text-amber-600', bg: 'bg-amber-100', href: '/admin/markets' },
    { name: 'Completed Transactions', value: '3,150', icon: History, color: 'text-purple-600', bg: 'bg-purple-100', href: '/admin/transactions' },
    { name: 'Total Revenue', value: '₹4.2 Cr', icon: IndianRupee, color: 'text-rose-600', bg: 'bg-rose-100', href: '/admin/transactions' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href} className="block transition-transform hover:-translate-y-1">
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className={`p-4 rounded-full ${stat.bg} ${stat.color} mb-4`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-gray-400" />
              Platform Growth (Demo)
            </h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 border-dashed">
              <p className="text-gray-400">Chart Visualization Area</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <History className="mr-2 h-5 w-5 text-gray-400" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">New farmer registered from Nizamabad</p>
                    <p className="text-xs text-gray-500">{i} hour(s) ago</p>
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
