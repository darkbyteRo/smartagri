'use client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCheck, Store, IndianRupee, History, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Farmers', href: '/admin/farmers', icon: Users },
    { name: 'Buyers', href: '/admin/buyers', icon: UserCheck },
    { name: 'Markets', href: '/admin/markets', icon: Store },
    { name: 'Prices', href: '/admin/prices', icon: IndianRupee },
    { name: 'Transactions', href: '/admin/transactions', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:flex-shrink-0 flex flex-col h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 bg-gray-950 border-b border-gray-800 flex-shrink-0">
          <span className="text-xl font-bold">Admin Portal</span>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden justify-between">
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}
                  `}
                >
                  <Icon className="mr-3 flex-shrink-0 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center mb-4">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.full_name || 'Admin'}</p>
                <p className="text-xs font-medium text-gray-400">Administrator</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold text-gray-900">Admin</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
