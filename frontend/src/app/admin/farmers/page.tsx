'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';

const DEMO_FARMERS = [
  { id: 'f1', name: 'Ramesh Patel', email: 'ramesh@example.com', district: 'Nizamabad', listings: 12, joined: '2023-01-15' },
  { id: 'f2', name: 'Suresh Kumar', email: 'suresh@example.com', district: 'Karimnagar', listings: 5, joined: '2023-03-22' },
  { id: 'f3', name: 'Anitha Reddy', email: 'anitha@example.com', district: 'Warangal', listings: 18, joined: '2022-11-05' },
  { id: 'f4', name: 'Venkat Rao', email: 'venkat@example.com', district: 'Khammam', listings: 2, joined: '2023-10-12' },
];

export default function AdminFarmers() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const filteredFarmers = DEMO_FARMERS.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmers</h1>
          <p className="text-gray-500 mt-1">Manage registered farmers on the platform.</p>
        </div>
        <div className="w-full sm:w-64">
          <Input 
            placeholder="Search farmers..." 
            icon={<Search size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4 text-center">Listings</th>
                <th className="px-6 py-4 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((farmer) => (
                <tr key={farmer.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{farmer.name}</td>
                  <td className="px-6 py-4 text-gray-500">{farmer.email}</td>
                  <td className="px-6 py-4">{farmer.district}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs font-semibold">
                      {farmer.listings}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">{farmer.joined}</td>
                </tr>
              ))}
              {filteredFarmers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No farmers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
