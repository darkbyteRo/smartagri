'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { IndianRupee } from 'lucide-react';

const DEMO_TRANSACTIONS = [
  { id: 'TXN-1001', farmer: 'Ramesh Patel', buyer: 'FreshMart Foods', crop: 'Tomatoes', qty: 500, price: 20, status: 'COMPLETED', date: '2023-11-04' },
  { id: 'TXN-1002', farmer: 'Anitha Reddy', buyer: 'AgriCorp Exports', crop: 'Onions', qty: 2000, price: 15, status: 'IN_PROGRESS', date: '2023-11-05' },
  { id: 'TXN-1003', farmer: 'Suresh Kumar', buyer: 'Local Grocers Union', crop: 'Rice', qty: 1000, price: 45, status: 'INITIATED', date: '2023-11-06' },
  { id: 'TXN-1004', farmer: 'Venkat Rao', buyer: 'FreshMart Foods', crop: 'Tomatoes', qty: 200, price: 22, status: 'CANCELLED', date: '2023-11-02' },
];

export default function AdminTransactions() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">In Progress</Badge>;
      case 'INITIATED': return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Initiated</Badge>;
      case 'CANCELLED': return <Badge variant="error">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">Monitor platform transactions and settlements.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">ID / Date</th>
                <th className="px-6 py-4">Parties</th>
                <th className="px-6 py-4">Crop Details</th>
                <th className="px-6 py-4 text-right">Total Value</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_TRANSACTIONS.map((txn) => (
                <tr key={txn.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{txn.id}</div>
                    <div className="text-xs text-gray-500">{txn.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="text-gray-500">F: </span><span className="font-medium text-gray-900">{txn.farmer}</span>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="text-gray-500">B: </span><span className="font-medium text-gray-900">{txn.buyer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{txn.crop}</div>
                    <div className="text-xs text-gray-500">{txn.qty} kg @ ₹{txn.price}/kg</div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    <span className="flex items-center justify-end"><IndianRupee className="w-3 h-3" />{(txn.qty * txn.price).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {getStatusBadge(txn.status)}
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
