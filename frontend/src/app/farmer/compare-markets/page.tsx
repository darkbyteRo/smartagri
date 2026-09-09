'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { MarketComparisonCard } from '@/components/market/MarketComparisonCard';
import { SellHoldCard } from '@/components/recommendation/SellHoldCard';
import { PriceTrendChart, PriceDataPoint } from '@/components/charts/PriceTrendChart';
import api from '@/lib/api';
import { Crop, District, MarketComparison, SellHoldRecommendation } from '@/types';
import toast from 'react-hot-toast';

export default function CompareMarketsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedCrop, setSelectedCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  
  // Results state
  const [comparisons, setComparisons] = useState<MarketComparison[]>([]);
  const [recommendation, setRecommendation] = useState<SellHoldRecommendation | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cropsRes, distRes] = await Promise.all([
          api.get('/crops'),
          api.get('/markets/districts')
        ]);
        setCrops(cropsRes.data || []);
        setDistricts(distRes.data || []);
      } catch (error) {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !quantity || !selectedDistrict) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setComparisons([]);
    setRecommendation(null);

    const district = districts.find(d => d.id.toString() === selectedDistrict);
    
    try {
      const payload = {
        crop_id: parseInt(selectedCrop),
        quantity_kg: parseFloat(quantity),
        farmer_latitude: district?.latitude || 17.3850,
        farmer_longitude: district?.longitude || 78.4867,
        quality_grade: qualityGrade
      };

      const [compRes, recRes] = await Promise.all([
        api.post('/intelligence/compare', payload),
        api.post('/recommendations/sell-hold', payload)
      ]);

      setComparisons(compRes.data.comparisons || compRes.data.data || []);
      setRecommendation(recRes.data.data || recRes.data);
      toast.success('Market comparison generated');
    } catch (error) {
      toast.error('Failed to generate market comparison');
    } finally {
      setSubmitting(false);
    }
  };

  const getChartData = (): PriceDataPoint[] => {
    if (!recommendation?.price_predictions) return [];
    
    // Sort predictions by date
    const sorted = [...recommendation.price_predictions].sort((a, b) => 
      new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    );
    
    return sorted.map(p => ({
      date: new Date(p.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      predictedPrice: p.predicted_price,
      // For demo purposes, we'll just show current best price as actual for first point if needed,
      // but standard is to just return predictions here.
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compare Markets</h1>
        <p className="text-gray-500">Find the most profitable market for your produce</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Crop"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                options={[
                  { value: '', label: 'Select Crop', disabled: true },
                  ...crops.map(c => ({ 
                    value: c.id.toString(), 
                    label: c.name_telugu ? `${c.name} (${c.name_telugu})` : c.name 
                  }))
                ]}
                required
              />
              <Input
                label="Quantity (kg)"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1000"
                required
              />
              <Select
                label="Quality Grade"
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                options={[
                  { value: 'A', label: 'Premium (Grade A)' },
                  { value: 'B', label: 'Standard (Grade B)' },
                  { value: 'C', label: 'Economy (Grade C)' }
                ]}
              />
              <Select
                label="Your Location (District)"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                options={[
                  { value: '', label: 'Select District', disabled: true },
                  ...districts.map(d => ({ value: d.id.toString(), label: d.name }))
                ]}
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={submitting} className="w-full md:w-auto">
                Analyze Markets
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {submitting && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Spinner size="lg" />
          <p className="text-emerald-700 font-medium">Analyzing market data and transport costs...</p>
        </div>
      )}

      {recommendation && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Recommendation</h2>
            <SellHoldCard recommendation={recommendation} />
          </div>
          
          {recommendation.price_predictions && recommendation.price_predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Price Forecast (Next 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceTrendChart data={getChartData()} />
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Market Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparisons.map((comp, idx) => (
                <MarketComparisonCard key={comp.market.id} comparison={{...comp, rank: idx + 1}} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
