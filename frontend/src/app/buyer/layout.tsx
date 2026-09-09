'use client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Search, FileText, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/buyer/dashboard', icon: LayoutDashboard },
    { name: 'My Requirements', href: '/buyer/requirements', icon: ShoppingCart },
    { name: 'Browse Listings', href: '/buyer/browse', icon: Search },
    { name: 'My Offers', href: '/buyer/offers', icon: FileText },
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
        fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:flex-shrink-0 flex flex-col h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 bg-blue-950 border-b border-blue-800 flex-shrink-0">
          <span className="text-xl font-bold">SmartAgri Buyer</span>
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
                    ${isActive ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800'}
                  `}
                >
                  <Icon className="mr-3 flex-shrink-0 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center mb-4">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.full_name}</p>
                <p className="text-xs font-medium text-blue-300">Buyer</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-blue-200 rounded-md hover:bg-blue-800"
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
          <span className="text-lg font-bold text-blue-900">SmartAgri</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
