'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Leaf, Building2, UserCheck, ShieldCheck } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (eEmail = email, ePassword = password) => {
    setLoading(true);
    try {
      await login({ email: eEmail, password: ePassword });
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  const fillAndLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    await handleLogin(demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Leaf className="w-12 h-12 text-emerald-600 mb-4" />
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or use one of the 1-click demo accounts below
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Logins */}
        <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-2">
            ⚡ Quick Demo Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => fillAndLogin('buyer@demo.com', 'demo1234')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition-colors text-blue-900 text-xs font-medium"
            >
              <Building2 className="w-4 h-4 mb-1 text-blue-600" />
              <span>Buyer</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => fillAndLogin('farmer@demo.com', 'demo1234')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 transition-colors text-emerald-900 text-xs font-medium"
            >
              <UserCheck className="w-4 h-4 mb-1 text-emerald-600" />
              <span>Farmer</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => fillAndLogin('admin@demo.com', 'admin1234')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 transition-colors text-purple-900 text-xs font-medium"
            >
              <ShieldCheck className="w-4 h-4 mb-1 text-purple-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button type="submit" className="w-full" isLoading={loading}>
                Sign in
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-100 py-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

