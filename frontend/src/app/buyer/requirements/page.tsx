'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { MapPin, Calendar, IndianRupee, Search, Filter, ShoppingCart, Plus } from 'lucide-react';
import type { BuyerRequirement, Crop } from '@/types';

// Demo data
const DEMO_REQUIREMENTS: BuyerRequirement[] = [
  {
    id: 'req_1',
    buyer_id: 'buyer_1',
    crop_id: 1,
    crop_name: 'Tomatoes',
    quantity_kg_min: 500,
    quantity_kg_max: 1000,
    quality_grade_min: 'A',
    max_price_per_kg: 25,
    needed_by: '2023-11-15',
    status: 'ACTIVE'
  },
  {
    id: 'req_2',
    buyer_id: 'buyer_1',
    crop_id: 2,
    crop_name: 'Onions',
    quantity_kg_min: 2000,
    quantity_kg_max: 5000,
    quality_grade_min: 'B',
    max_price_per_kg: 18,
    needed_by: '2023-11-20',
    status: 'ACTIVE'
  }
];

const DEMO_CROPS: Crop[] = [
  { id: 1, name: 'Tomatoes', unit: 'kg' },
  { id: 2, name: 'Onions', unit: 'kg' },
  { id: 3, name: 'Rice', unit: 'kg' },
];

export default function BuyerRequirements() {
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setRequirements(DEMO_REQUIREMENTS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setIsModalOpen(false);
      // In a real app, we'd fetch the updated list or append the new item
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requirements</h1>
          <p className="text-gray-500 mt-1">Manage your crop sourcing needs.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Post New Requirement
        </Button>
      </div>

      {requirements.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="No Active Requirements"
          description="You haven't posted any requirements yet. Post one to start receiving offers from farmers."
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              Post Requirement
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((req) => (
            <Card key={req.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{req.crop_name}</h3>
                    <div className="text-sm text-gray-500 mt-1 flex gap-2">
                      <Badge variant="outline">Grade {req.quality_grade_min}</Badge>
                      <Badge variant={req.status === 'ACTIVE' ? 'success' : 'default'}>
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Quantity:</span>
                    <span className="font-medium text-gray-900">{req.quantity_kg_min} - {req.quantity_kg_max} kg</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Max Price:</span>
                    <span className="font-medium text-gray-900 flex items-center">
                      <IndianRupee className="h-3 w-3 mr-0.5" />{req.max_price_per_kg}/kg
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Needed by:</span>
                    <span className="font-medium text-gray-900 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />{req.needed_by}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                  <Button variant="outline" className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <Search className="h-4 w-4 mr-2" />
                    Find Matches
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => !submitting && setIsModalOpen(false)} title="Post New Requirement">
        <form onSubmit={handleCreateRequirement} className="space-y-4">
          <Select 
            label="Crop" 
            placeholder="Select Crop"
            options={DEMO_CROPS.map(c => ({ label: c.name, value: c.id }))} 
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Quantity (kg)" type="number" min="1" required />
            <Input label="Max Quantity (kg)" type="number" min="1" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Minimum Quality" 
              options={[
                { label: 'Grade A', value: 'A' },
                { label: 'Grade B', value: 'B' },
                { label: 'Grade C', value: 'C' }
              ]} 
              required
            />
            <Input 
              label="Max Price (₹/kg)" 
              type="number" 
              min="1" 
              step="0.1" 
              icon={<IndianRupee size={16} />} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Preferred District (Optional)" 
              options={[{ label: 'Any', value: '' }, { label: 'Hyderabad', value: '1' }]} 
            />
            <Input label="Needed By" type="date" required />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Post Requirement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
