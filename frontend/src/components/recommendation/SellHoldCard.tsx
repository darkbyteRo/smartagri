import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SellHoldRecommendation } from '@/types';
import { AlertCircle, CheckCircle, TrendingUp, Clock } from 'lucide-react';

interface SellHoldCardProps {
  recommendation: SellHoldRecommendation;
}

export function SellHoldCard({ recommendation }: SellHoldCardProps) {
  const getRecStyles = () => {
    switch (recommendation.recommendation) {
      case 'SELL':
        return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <TrendingUp className="w-8 h-8 text-red-600" /> };
      case 'HOLD':
        return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <Clock className="w-8 h-8 text-emerald-600" /> };
      case 'SELL_PARTIALLY':
        return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <AlertCircle className="w-8 h-8 text-amber-600" /> };
      default:
        return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', icon: null };
    }
  };

  const styles = getRecStyles();

  return (
    <Card className={`border-2 ${styles.bg}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className={`p-4 rounded-full bg-white shadow-sm border ${styles.bg.split(' ')[1]}`}>
            {styles.icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-2xl font-black tracking-tight mb-2 ${styles.text}`}>
              {recommendation.recommendation?.replace('_', ' ')}
            </h3>
            <p className="text-gray-700 font-medium">{recommendation.explanation}</p>
          </div>
          <div className="flex flex-col gap-2 items-center md:items-end min-w-[120px]">
            <Badge variant={recommendation.risk_level === 'LOW' ? 'success' : recommendation.risk_level === 'MEDIUM' ? 'warning' : 'error'}>
              {recommendation.risk_level} RISK
            </Badge>
            <div className="text-sm font-medium text-gray-500">
              Confidence: <span className="text-gray-900">{Math.round(recommendation.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {recommendation.expected_benefit && recommendation.expected_benefit > 0 ? (
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-100 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Expected Benefit by Holding</p>
              <p className="text-sm text-gray-600">You could gain an estimated ₹{recommendation.expected_benefit.toLocaleString()} more by waiting.</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
