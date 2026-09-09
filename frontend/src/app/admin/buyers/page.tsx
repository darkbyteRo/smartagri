'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Search, CheckCircle } from 'lucide-react';

const DEMO_BUYERS = [
  { id: 'b1', name: 'FreshMart Foods', type: 'Retailer', email: 'contact@freshmart.com', verified: true, score: 95 },
  { id: 'b2', name: 'AgriCorp Exports', type: 'Exporter', email: 'info@agricorp.com', verified: true, score: 88 },
  { id: 'b3', name: 'Local Grocers Union', type: 'Wholesaler', email: 'admin@lgu.org', verified: false, score: 45 },
];

export default function AdminBuyers() {
  const [loading, setLoading] = useState(true);
  const [buyers, setBuyers] = useState(DEMO_BUYERS);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = (id: string) => {
    setBuyers(buyers.map(b => b.id === id ? { ...b, verified: true, score: 80 } : b));
  };

  const filteredBuyers = buyers.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyers</h1>
          <p className="text-gray-500 mt-1">Manage and verify platform buyers.</p>
        </div>
        <div className="w-full sm:w-64">
          <Input 
            placeholder="Search buyers..." 
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
                <th className="px-6 py-4">Business Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Reliability</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuyers.map((buyer) => (
                <tr key={buyer.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{buyer.name}</td>
                  <td className="px-6 py-4 text-gray-500">{buyer.type}</td>
                  <td className="px-6 py-4 text-gray-500">{buyer.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${buyer.score >= 80 ? 'bg-emerald-500' : buyer.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                          style={{ width: `${buyer.score}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{buyer.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {buyer.verified ? (
                      <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" />Verified</Badge>
                    ) : (
                      <Badge variant="warning">Unverified</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!buyer.verified && (
                      <Button size="sm" variant="outline" onClick={() => handleVerify(buyer.id)}>
                        Verify
                      </Button>
                    )}
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
