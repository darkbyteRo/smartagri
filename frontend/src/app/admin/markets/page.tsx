'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

const DEMO_MARKETS = [
  { id: 1, name: 'Nizamabad APMC', district: 'Nizamabad', type: 'APMC', fee: 1.5, status: 'Active' },
  { id: 2, name: 'Bowenpally Market', district: 'Hyderabad', type: 'APMC', fee: 1.0, status: 'Active' },
  { id: 3, name: 'Warangal ENAM', district: 'Warangal', type: 'ENAM', fee: 0.5, status: 'Active' },
  { id: 4, name: 'Khammam Private Mandi', district: 'Khammam', type: 'PRIVATE', fee: 2.0, status: 'Maintenance' },
];

export default function AdminMarkets() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Markets</h1>
        <p className="text-gray-500 mt-1">Manage physical market locations and fee structures.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Market Name</th>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-center">Fee %</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_MARKETS.map((market) => (
                <tr key={market.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{market.name}</td>
                  <td className="px-6 py-4 text-gray-500">{market.district}</td>
                  <td className="px-6 py-4">
                    <Badge variant={market.type === 'APMC' ? 'default' : market.type === 'ENAM' ? 'success' : 'outline'}>
                      {market.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{market.fee}%</td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant={market.status === 'Active' ? 'success' : 'warning'}>
                      {market.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
