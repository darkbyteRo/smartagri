'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/types';
import api from '@/lib/api';
import { setToken, removeToken, getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await api.get('/auth/me');
          const data = response.data;
          const normalized = data.user ? { ...data.user, profile_id: data.id } : data;
          setUser(normalized);
        } catch (error) {
          removeToken();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (data: LoginRequest) => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    setToken(response.data.access_token);
    setUser(response.data.user);
    
    const role = response.data.user.role.toLowerCase();
    router.push(`/${role}/dashboard`);
  };

  const register = async (data: RegisterRequest) => {
    await api.post('/auth/register', data);
    router.push('/login');
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
