'use client';

import { useAdminAuth } from '@/lib/adminAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { 
  LayoutDashboard, Users, Package, LogOut, Menu, X, Settings, 
  ShoppingCart, UserCheck, FolderOpen, DollarSign, BarChart3, Wallet, ArrowUpRight, Award, TrendingUp, Image
} from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [optimisticPath, setOptimisticPath] = useState(null);
  const { theme } = useTheme();

  // If on the root /admin path, render without any auth checks (let page.js handle it)
  const isRootAdminPath = pathname === '/admin';
  if (isRootAdminPath) {
    return <>{children}</>;
  }

  // For all other admin routes, apply full auth check
  const { user } = useAdminAuth();

  // Prefetch all navigation routes on mount for instant navigation
  useEffect(() => {
    navigation.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    toast.success('Logged out successfully');
    
    // Reset theme to light for public pages
    localStorage.removeItem('adminTheme');
    
    router.push('/');
  };

  const handleNavigation = (href) => {
    // Skip if already on this page
    if (pathname === href) return;
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    
    // Immediate visual feedback
    setOptimisticPath(href);
    
    // Use startTransition for smooth navigation
    startTransition(() => {
      router.push(href);
      // Clear optimistic state after a short delay
      setTimeout(() => setOptimisticPath(null), 300);
    });
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Returns', href: '/admin/returns', icon: Package },
    { name: 'Manufacturers', href: '/admin/manufacturers', icon: Users },
    { name: 'Resellers', href: '/admin/resellers', icon: UserCheck },
    { name: 'Upgrade Requests', href: '/admin/reseller-upgrade-requests', icon: UserCheck },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
    { name: 'Wallets', href: '/admin/wallets', icon: Wallet },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowUpRight },
    { name: 'Settlements', href: '/admin/settlements', icon: DollarSign },
    { name: 'Referrals', href: '/admin/referrals', icon: Award },
    { name: 'Banners', href: '/admin/banners', icon: Image },
    { name: 'Demand Analytics', href: '/admin/demand-analytics', icon: TrendingUp },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (!user) return null; // Wait for auth check

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
            <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>Skaarvi Admin</h1>
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
              const isOptimistic = optimisticPath === item.href;
              const shouldHighlight = isActive || isOptimistic;
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isOptimistic}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-100 ease-out transform hover:scale-[1.02] active:scale-[0.98] w-full disabled:cursor-wait"
                  style={shouldHighlight ? {
                    backgroundColor: 'rgb(var(--color-primary))',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    opacity: isOptimistic ? 0.9 : 1
                  } : {
                    color: 'rgb(var(--color-text))'
                  }}
                  onMouseEnter={(e) => {
                    if (!shouldHighlight) {
                      e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary), 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px) scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!shouldHighlight) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0) scale(1)';
                    }
                  }}
                >
                  <Icon className={`w-5 h-5 ${isOptimistic ? 'animate-pulse' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                  {isOptimistic && (
                    <div className="ml-auto">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4" style={{ borderTop: '1px solid rgb(var(--color-border))' }}>
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: 'rgb(var(--color-primary))' }}>
                {user.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--color-text))' }}>{user.email}</p>
                <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>Administrator</p>
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
          {isPending && (
            <div className="fixed top-16 left-0 right-0 z-50 h-1" style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)' }}>
              <div 
                className="h-full animate-loading-bar" 
                style={{ backgroundColor: 'rgb(var(--color-primary))' }}
              />
            </div>
          )}
          <div className={`transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {children}
          </div>
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
