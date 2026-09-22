'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Wallet, 
  Users,
  BarChart3,
  User,
  BookmarkIcon,
  LogOut, 
  Menu, 
  X,
  Download,
  Store,
  ArrowDownCircle,
  Trophy,
  HelpCircle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import NotificationBell from '@/components/NotificationBell';
import MobileRoleNavigation from '@/components/navigation/MobileRoleNavigation';

export default function ResellerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const sidebarRef = useRef(null);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // Give Redux persist time to hydrate
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const syncNavigationMode = () => {
      setIsDesktop(desktopQuery.matches);
      setSidebarOpen(desktopQuery.matches);
    };

    syncNavigationMode();
    desktopQuery.addEventListener('change', syncNavigationMode);
    return () => desktopQuery.removeEventListener('change', syncNavigationMode);
  }, []);

  useEffect(() => {
    // Only check auth after hydration is complete
    if (isChecking) return;

    // Redirect if not logged in
    if (!user) {
      router.push('/');
      return;
    }
    
    // Redirect if not reseller (check both role and resellerId)
    // Allow access if user has resellerId (they're a reseller, even if logged in as customer)
    if (user.role !== 'reseller' && !user.resellerId) {
      console.log('[Reseller Layout] Access denied - role:', user.role, 'resellerId:', user.resellerId);
      router.push('/unauthorized');
    }
  }, [user, router, isChecking]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const closeSidebarOnOutsideClick = (event) => {
      if (!sidebarRef.current || sidebarRef.current.contains(event.target)) return;

      const clickedElement = event.target instanceof Element ? event.target : null;
      const isInteractive = clickedElement?.closest(
        'a, button, input, select, textarea, label, [role="button"], [role="link"]'
      );
      if (!isInteractive) setSidebarOpen(false);
    };

    document.addEventListener('click', closeSidebarOnOutsideClick);
    return () => document.removeEventListener('click', closeSidebarOnOutsideClick);
  }, [sidebarOpen]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
          <p className="mt-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render layout if not authenticated or wrong role
  // Allow access if user has resellerId (they're a reseller, even if logged in as customer)
  if (!user || (user.role !== 'reseller' && !user.resellerId)) {
    return null;
  }

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
    localStorage.removeItem('resellerTheme');
    
    window.location.replace('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/reseller/dashboard', icon: LayoutDashboard },
    { name: 'My Store', href: '/reseller/my-store', icon: Store },
    { name: 'Products', href: '/reseller/products', icon: Package },
    { name: 'Saved Products', href: '/reseller/saved-products', icon: BookmarkIcon },
    { name: 'Orders', href: '/reseller/orders', icon: ShoppingCart },
    { name: 'Earnings', href: '/reseller/earnings', icon: DollarSign },
    { name: 'Wallet', href: '/reseller/wallet', icon: Wallet },
    { name: 'Withdrawals', href: '/reseller/withdrawals', icon: ArrowDownCircle },
    { name: 'Referrals', href: '/reseller/referrals', icon: Users },
    { name: 'Leaderboard', href: '/reseller/leaderboard', icon: Trophy },
    { name: 'Media Center', href: '/reseller/media-center', icon: Download },
    { name: 'Analytics', href: '/reseller/analytics', icon: BarChart3 },
    { name: 'Support', href: '/reseller/support', icon: HelpCircle },
    { name: 'Profile', href: '/reseller/profile', icon: User },
  ];
  const mobileNavigation = [
    { name: 'Home', href: '/reseller/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/reseller/products', icon: Package },
    { name: 'Saved', href: '/reseller/saved-products', icon: BookmarkIcon },
    { name: 'Orders', href: '/reseller/orders', icon: ShoppingCart },
  ];
  const currentPage = navigation.find((item) => (
    pathname === item.href || pathname?.startsWith(`${item.href}/`)
  ))?.name || 'Skaarvi Resell';

  if (!user) return null;

  return (
    <div className="portal-shell min-h-screen" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
      {sidebarOpen && (
        <div
          className="pointer-events-none fixed inset-0 z-[45] bg-black/30 lg:bg-transparent"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 pt-[env(safe-area-inset-top)] shadow-xl transition-all duration-300 ease-in-out lg:pt-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          backgroundColor: 'rgb(var(--color-background))',
          borderRight: '1px solid rgb(var(--color-border))'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6" style={{ borderBottom: '1px solid rgb(var(--color-border))' }}>
            <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>Skaarvi Resell</h1>
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
                  onClick={() => {
                    if (!isDesktop) setSidebarOpen(false);
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
                {user.email?.[0]?.toUpperCase() || 'R'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--color-text))' }}>{user.email}</p>
                <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>Reseller</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ease-in-out hover:scale-[1.02]"
              style={{ color: 'rgb(var(--color-danger))' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(var(--color-danger), 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header 
          className="sticky top-0 z-40 flex min-h-16 items-center justify-between px-4 pt-[env(safe-area-inset-top)] shadow-sm lg:h-16 lg:px-6 lg:pt-0"
          style={{ 
            backgroundColor: 'rgb(var(--color-background))',
            borderBottom: '1px solid rgb(var(--color-border))'
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
            style={{ color: 'rgb(var(--color-text))' }}
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <p className="min-w-0 flex-1 truncate px-3 text-base font-semibold lg:hidden" style={{ color: 'rgb(var(--color-text))' }}>
            {currentPage}
          </p>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      <MobileRoleNavigation
        items={mobileNavigation}
        pathname={pathname}
        moreOpen={sidebarOpen}
        onMoreToggle={() => setSidebarOpen((open) => !open)}
        onNavigate={() => setSidebarOpen(false)}
      />
    </div>
  );
}
