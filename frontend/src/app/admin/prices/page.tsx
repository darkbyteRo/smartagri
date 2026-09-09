'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { IndianRupee, Zap, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

interface PriceRecord {
  id: number;
  crop_id: number;
  market_id: number;
  crop_name?: string;
  market_name?: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  price_date: string;
  source: string;
  arrival_qty?: number;
}

export default function AdminPrices() {
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cropFilter, setCropFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');

  const fetchPrices = async () => {
    try {
      const res = await api.get('/prices/latest');
      setPrices(res.data);
    } catch (err) {
      console.error('Failed to load prices:', err);
      toast.error('Could not load latest prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/prices/sync');
      const data = res.data;
      toast.success(
        data.message || `Successfully synced ${data.synced_records} live prices from ${data.source || 'Agmarknet'}`
      );
      await fetchPrices();
    } catch (err: any) {
      console.error('Price sync failed:', err);
      toast.error(getErrorMessage(err, 'Failed to sync live mandi prices'));
    } finally {
      setSyncing(false);
    }
  };

  const cropOptions = useMemo(() => {
    const crops = Array.from(new Set(prices.map((p) => p.crop_name).filter(Boolean))) as string[];
    return [{ label: 'All Crops', value: '' }, ...crops.map((c) => ({ label: c, value: c }))];
  }, [prices]);

  const marketOptions = useMemo(() => {
    const markets = Array.from(new Set(prices.map((p) => p.market_name).filter(Boolean))) as string[];
    return [{ label: 'All Markets', value: '' }, ...markets.map((m) => ({ label: m, value: m }))];
  }, [prices]);

  const filteredPrices = useMemo(() => {
    return prices.filter(
      (p) =>
        (cropFilter === '' || p.crop_name === cropFilter) &&
        (marketFilter === '' || p.market_name === marketFilter)
    );
  }, [prices, cropFilter, marketFilter]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mandi Market Prices</h1>
          <p className="text-gray-500 mt-1">
            Real-time wholesale auction rates across 20 APMC markets in Telangana.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchPrices}
            variant="outline"
            className="flex items-center gap-1.5"
            disabled={loading || syncing}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={handleSync}
            isLoading={syncing}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            Sync Live Mandi Prices
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/3">
          <Select
            label="Filter by Crop"
            options={cropOptions}
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-1/3">
          <Select
            label="Filter by Market"
            options={marketOptions}
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-1/3 flex items-end">
          <p className="text-xs text-gray-500 pb-2">
            Showing <span className="font-semibold text-gray-800">{filteredPrices.length}</span> of{' '}
            <span className="font-semibold text-gray-800">{prices.length}</span> latest records
          </p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Crop</th>
                <th className="px-6 py-4">Market</th>
                <th className="px-6 py-4 text-center">Min Price</th>
                <th className="px-6 py-4 text-center">Max Price</th>
                <th className="px-6 py-4 text-center">Modal Price</th>
                <th className="px-6 py-4 text-center">Arrival (Tons)</th>
                <th className="px-6 py-4 text-right">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrices.map((price) => (
                <tr key={price.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{price.price_date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{price.crop_name || `Crop #${price.crop_id}`}</td>
                  <td className="px-6 py-4 text-gray-700">{price.market_name || `Market #${price.market_id}`}</td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    <span className="flex items-center justify-center">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {price.min_price}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    <span className="flex items-center justify-center">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {price.max_price}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-emerald-700 bg-emerald-50/60">
                    <span className="flex items-center justify-center">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {price.modal_price}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {price.arrival_qty ? `${price.arrival_qty.toFixed(0)} T` : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge
                      variant={
                        price.source?.includes('AGMARKNET') || price.source?.includes('DATA_GOV')
                          ? 'success'
                          : 'outline'
                      }
                    >
                      {price.source}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredPrices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No price records found.
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
