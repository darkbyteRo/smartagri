import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MarketComparison } from '@/types';
import { MapPin } from 'lucide-react';

interface MarketComparisonCardProps {
  comparison: MarketComparison;
}

export function MarketComparisonCard({ comparison }: MarketComparisonCardProps) {
  const isBest = comparison.rank === 1;

  const demandColor = 
    comparison.demand_level === 'HIGH' ? 'success' :
    comparison.demand_level === 'MEDIUM' ? 'warning' : 'error';

  return (
    <Card className={`relative overflow-hidden ${isBest ? 'border-2 border-emerald-500 shadow-md' : ''}`}>
      {isBest && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-lg text-xs font-bold">
          BEST OPTION
        </div>
      )}
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {comparison.market.name}
            </h3>
            {comparison.market.name_telugu && (
              <p className="text-sm text-gray-500 font-medium">{comparison.market.name_telugu}</p>
            )}
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {comparison.distance_km} km away
            </div>
          </div>
          <Badge variant={demandColor} className="ml-2 flex-shrink-0">
            {comparison.demand_level} DEMAND
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500 mb-1">Current Price</p>
            <p className="text-lg font-semibold text-gray-900">₹{comparison.current_price?.modal_price || 0}/kg</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-md border border-emerald-100">
            <p className="text-xs text-emerald-700 mb-1 font-medium">Net Realization</p>
            <p className="text-xl font-bold text-emerald-700">₹{comparison.net_per_kg?.toFixed(2)}/kg</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 border-t pt-3">
          <div className="flex justify-between">
            <span>Transport Cost:</span>
            <span className="font-medium">₹{comparison.transport_cost?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Market Fee:</span>
            <span className="font-medium">₹{comparison.market_fee?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-900 font-semibold pt-1 border-t">
            <span>Total Net (for requested qty):</span>
            <span>₹{comparison.net_realization?.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
