'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, RegisterRequest } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('FARMER');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    district_id: '1', // Default, should fetch
    village: '',
    business_name: '',
    business_type: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
        role,
        ...(role === 'FARMER' ? {
          district_id: parseInt(formData.district_id),
          village: formData.village
        } : {
          business_name: formData.business_name,
          business_type: formData.business_type
        })
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
              
              {role === 'FARMER' && (
                <>
                  <Select 
                    label="District" 
                    name="district_id" 
                    placeholder="Select District"
                    value={formData.district_id} 
                    onChange={handleChange}
                    options={[{ label: 'Hyderabad', value: 1 }, { label: 'Warangal', value: 2 }, { label: 'Nizamabad', value: 3 }]}
                  />
                  <Input label="Village" name="village" value={formData.village} onChange={handleChange} />
                </>
              )}

              {role === 'BUYER' && (
                <>
                  <Input label="Business Name" name="business_name" value={formData.business_name} onChange={handleChange} />
                  <Input label="Business Type (e.g. Retailer, Exporter)" name="business_type" value={formData.business_type} onChange={handleChange} />
                </>
              )}

              <Button type="submit" className="w-full mt-4" isLoading={loading}>
                Register
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
