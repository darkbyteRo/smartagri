'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, RegisterRequest } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Leaf } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const DEFAULT_DISTRICTS = [
  { label: 'Hyderabad', value: 4 },
  { label: 'Warangal', value: 32 },
  { label: 'Hanumakonda', value: 3 },
  { label: 'Nizamabad', value: 23 },
  { label: 'Karimnagar', value: 10 },
  { label: 'Khammam', value: 11 },
  { label: 'Sangareddy', value: 27 },
  { label: 'Rangareddy', value: 26 },
  { label: 'Suryapet', value: 29 },
  { label: 'Nalgonda', value: 20 },
];

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('FARMER');
  const [districts, setDistricts] = useState<{ label: string; value: number }[]>(DEFAULT_DISTRICTS);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    district_id: '4',
    village: '',
    business_name: '',
    business_type: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      if (urlRole && urlRole.toUpperCase() === 'BUYER') {
        setRole('BUYER');
      }
    }

    const fetchDistricts = async () => {
      try {
        const res = await api.get('/markets/districts');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDistricts(res.data.map((d: any) => ({ label: d.name, value: d.id })));
        }
      } catch (err) {
        // Fallback to default districts
      }
    };
    fetchDistricts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const districtId = parseInt(formData.district_id) || 4;
      const payload: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
        role,
        district_id: districtId,
        ...(role === 'FARMER'
          ? {
              village: formData.village,
            }
          : {
              business_name: formData.business_name || `${formData.full_name}'s Trading`,
              business_type: formData.business_type || 'Wholesale Trader',
            }),
      };

      await register(payload);
      toast.success('Registration successful. Please login.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Leaf className="w-12 h-12 text-emerald-600 mb-4" />
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create an account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-6">
              <Button
                type="button"
                variant={role === 'FARMER' ? 'primary' : 'outline'}
                className="flex-1"
                onClick={() => setRole('FARMER')}
              >
                Farmer
              </Button>
              <Button
                type="button"
                variant={role === 'BUYER' ? 'primary' : 'outline'}
                className="flex-1"
                onClick={() => setRole('BUYER')}
              >
                Buyer
              </Button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input label="Full Name" name="full_name" required value={formData.full_name} onChange={handleChange} />
              <Input label="Email address" type="email" name="email" required value={formData.email} onChange={handleChange} />
              <Input label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              <Input label="Password" type="password" name="password" required value={formData.password} onChange={handleChange} />

              <Select
                label={role === 'FARMER' ? 'Farming District' : 'Business Location (District)'}
                name="district_id"
                value={formData.district_id}
                onChange={handleChange}
                options={districts}
              />

              {role === 'FARMER' && (
                <Input label="Village" name="village" value={formData.village} onChange={handleChange} />
              )}

              {role === 'BUYER' && (
                <>
                  <Input label="Business Name" name="business_name" placeholder="e.g. Srinivas Agro Trading" value={formData.business_name} onChange={handleChange} />
                  <Input label="Business Type (e.g. Retailer, Wholesaler, Exporter)" name="business_type" placeholder="Wholesale Trader" value={formData.business_type} onChange={handleChange} />
                </>
              )}

              <Button type="submit" className="w-full mt-4" isLoading={loading}>
                Register as {role === 'FARMER' ? 'Farmer' : 'Buyer'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-100 py-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

