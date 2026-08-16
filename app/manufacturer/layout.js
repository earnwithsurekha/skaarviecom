'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  BarChart3, 
  Warehouse,
  FileText,
  Banknote,
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function ManufacturerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme } = useTheme();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // Skip auth check for registration page
    if (pathname === '/manufacturer/register') {
      return;
    }
    
    // Redirect if not logged in or not manufacturer
    if (!user) {
      router.push('/unauthorized/manufacturer');
      return;
    }
    
    if (user.role !== 'manufacturer') {
      router.push('/unauthorized/manufacturer');
    }
  }, [user, router, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    toast.success('Logged out successfully');
    
    // Reset theme to light for public pages
    localStorage.removeItem('manufacturerTheme');
    
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/manufacturer/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/manufacturer/products', icon: Package },
    { name: 'Inventory', href: '/manufacturer/inventory', icon: Warehouse },
    { name: 'Orders', href: '/manufacturer/orders', icon: ShoppingCart },
    { name: 'Analytics', href: '/manufacturer/analytics', icon: BarChart3 },
    { name: 'Earnings', href: '/manufacturer/earnings', icon: DollarSign },
    { name: 'Settlements', href: '/manufacturer/settlements', icon: Banknote },
    { name: 'Reports', href: '/manufacturer/reports', icon: FileText },
  ];

  // If on registration page, render without layout
  if (pathname === '/manufacturer/register') {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 shadow-xl`}
        style={{ 
          backgroundColor: 'rgb(var(--color-background))',
          borderRight: '1px solid rgb(var(--color-border))'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6" style={{ borderBottom: '1px solid rgb(var(--color-border))' }}>
            <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>Skaarvi</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden hover:opacity-70 transition-opacity"
              style={{ color: 'rgb(var(--color-text-secondary))' }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                  style={isActive ? {
                    backgroundColor: 'rgb(var(--color-primary))',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  } : {
                    color: 'rgb(var(--color-text))'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary), 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4" style={{ borderTop: '1px solid rgb(var(--color-border))' }}>
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: 'rgb(var(--color-primary))' }}>
                {user.email?.[0]?.toUpperCase() || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--color-text))' }}>{user.email}</p>
                <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>Manufacturer</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ease-in-out hover:scale-[1.02]"
              style={{ color: 'rgb(var(--color-danger))' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(var(--color-danger), 0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40" style={{ 
          backgroundColor: 'rgb(var(--color-background))',
          borderBottom: '1px solid rgb(var(--color-border))'
        }}>
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:opacity-70 transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ color: 'rgb(var(--color-text-secondary))' }}
            >
              <Menu className="w-6 h-6" />
            </button>
            <ThemeSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
