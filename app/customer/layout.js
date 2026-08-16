'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  User,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Bell,
  Heart,
  Truck,
  Store
} from 'lucide-react';
import { logout } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import NotificationBell from '@/components/NotificationBell';
import PageLoader from '@/components/PageLoader';

export default function CustomerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false); // Desktop sidebar state
  const [mounted, setMounted] = useState(false);
  const [hasCustomerAccess, setHasCustomerAccess] = useState(null); // null = not checked yet, true = has access, false = no access
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessCheckError, setAccessCheckError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if reseller has customer access (was upgraded from customer)
  useEffect(() => {
    const checkCustomerAccess = async () => {
      console.log('[Customer Layout] Checking access for user:', user?.email, 'role:', user?.role);
      
      if (!user || user.role === 'customer') {
        console.log('[Customer Layout] User is customer, granting access');
        setHasCustomerAccess(true);
        setCheckingAccess(false);
        setAccessCheckError(null);
        return;
      }

      if (user.role === 'reseller') {
        try {
          const token = localStorage.getItem('token');
          console.log('[Customer Layout] User is reseller, checking for customer record...');
          
          const response = await fetch('/api/customer/check-access', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          console.log('[Customer Layout] API response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('[Customer Layout] API response data:', data);
            const hasAccess = data.hasAccess === true;
            setHasCustomerAccess(hasAccess);
            setAccessCheckError(null);
            
            if (!hasAccess) {
              console.warn('[Customer Layout] Reseller does NOT have customer access - will redirect');
            }
          } else {
            console.error('[Customer Layout] API error response:', response.status, response.statusText);
            // On API error, don't redirect immediately - show error
            setHasCustomerAccess(null);
            setAccessCheckError(`API error: ${response.status}`);
          }
        } catch (error) {
          console.error('[Customer Layout] Exception checking customer access:', error);
          // On exception, don't redirect immediately - show error
          setHasCustomerAccess(null);
          setAccessCheckError(error.message);
        }
      } else {
        console.log('[Customer Layout] User role is not customer or reseller:', user.role);
        setHasCustomerAccess(false);
        setAccessCheckError(null);
      }
      
      setCheckingAccess(false);
    };

    if (mounted && user) {
      checkCustomerAccess();
    }
  }, [user, mounted]);

  useEffect(() => {
    if (mounted && !loading && !checkingAccess) {
      console.log('[Customer Layout] Redirect check - auth:', isAuthenticated, 'hasAccess:', hasCustomerAccess, 'user:', user?.email, 'error:', accessCheckError);
      
      // Skip authentication check if on login or register pages
      if (pathname?.includes('/login') || pathname?.includes('/register')) {
        console.log('[Customer Layout] On public page, skipping auth check');
        return;
      }
      
      if (!isAuthenticated) {
        console.log('[Customer Layout] Not authenticated, redirecting to login');
        // Don't show toast here - SessionContext or login page will handle it
        router.push(`/login/customer?redirect=${encodeURIComponent(pathname)}`);
      } else if (hasCustomerAccess === false) {
        // Only redirect if we EXPLICITLY confirmed no access (not null/undefined)
        console.log('[Customer Layout] No customer access, redirecting...');
        toast.error('Access denied: This portal is for customers only');
        if (user?.role === 'reseller') {
          console.log('[Customer Layout] Redirecting to reseller dashboard');
          router.push('/reseller/dashboard');
        } else {
          console.log('[Customer Layout] Redirecting to unauthorized page');
          router.push('/unauthorized');
        }
      } else if (hasCustomerAccess === null && accessCheckError) {
        // Access check failed - show error but don't redirect
        console.error('[Customer Layout] Access check failed:', accessCheckError);
        toast.error(`Failed to verify access: ${accessCheckError}`);
      } else if (hasCustomerAccess === true) {
        console.log('[Customer Layout] Access granted, showing customer portal');
      }
    }
  }, [isAuthenticated, user, loading, mounted, router, pathname, hasCustomerAccess, checkingAccess, accessCheckError]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    router.push('/');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/customer',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Products',
      href: '/customer/products',
      icon: Package,
    },
    {
      name: 'Cart',
      href: '/customer/cart',
      icon: ShoppingCart,
    },
    {
      name: 'My Orders',
      href: '/customer/orders',
      icon: Truck,
    },
    {
      name: 'Returns',
      href: '/customer/returns',
      icon: Package,
    },
    {
      name: 'Wishlist',
      href: '/customer/wishlist',
      icon: Heart,
    },
    {
      name: 'Become a Reseller',
      href: '/customer/become-reseller',
      icon: Store,
      badge: user?.role === 'customer' ? 'new' : null,
    },
    {
      name: 'Profile',
      href: '/customer/profile',
      icon: User,
    },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  if (loading || !mounted || checkingAccess) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !hasCustomerAccess) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: 'rgb(var(--color-background))' }}
        className={`fixed top-0 left-0 z-50 h-full shadow-lg transform transition-all duration-300 ease-in-out ${
          desktopSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
            <div className={`flex items-center gap-3 ${desktopSidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, rgb(var(--color-primary)), rgb(59 130 246))' }}>
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className={desktopSidebarCollapsed ? 'lg:hidden' : ''}>
                <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>Skaarvi</h1>
                <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>Customer Portal</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden transition-colors"
              style={{ color: 'rgb(var(--color-text-secondary))' }}
            >
              <X className="h-6 w-6" />
            </button>
            {/* Desktop collapse button */}
            <button
              onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
              className="hidden lg:block transition-colors"
              style={{ color: 'rgb(var(--color-text-secondary))' }}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          <div className={`p-4 border-b ${desktopSidebarCollapsed ? 'lg:flex lg:justify-center' : ''}`} style={{ borderColor: 'rgb(var(--color-border))' }}>
            <div className={`flex items-center gap-3 ${desktopSidebarCollapsed ? 'lg:flex-col lg:gap-2' : ''}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, rgb(var(--color-primary)), rgb(59 130 246))' }}>
                <span className="text-white font-bold text-lg">
                  {user?.name?.[0]?.toUpperCase() || user?.full_name?.[0]?.toUpperCase() || 'C'}
                </span>
              </div>
              <div className={`flex-1 min-w-0 ${desktopSidebarCollapsed ? 'lg:hidden' : ''}`}>
                <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--color-text))' }}>
                  {user?.name || user?.full_name || 'Customer'}
                </p>
                <p className="text-xs truncate" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                const isCartItem = item.href === '/customer/cart';
                const hasBadge = item.badge;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                        desktopSidebarCollapsed ? 'lg:justify-center' : ''
                      }`}
                      style={active ? {
                        backgroundColor: 'rgba(var(--color-primary), 0.1)',
                        color: 'rgb(var(--color-primary))',
                        fontWeight: '600'
                      } : {
                        color: 'rgb(var(--color-text))'
                      }}
                      title={desktopSidebarCollapsed ? item.name : ''}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className={desktopSidebarCollapsed ? 'lg:hidden' : ''}>{item.name}</span>
                      {isCartItem && totalItems > 0 && (
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${desktopSidebarCollapsed ? 'lg:absolute lg:top-1 lg:right-1 lg:ml-0' : ''}`} style={{
                          backgroundColor: 'rgb(var(--color-primary))',
                          color: 'white'
                        }}>
                          {totalItems > 9 ? '9+' : totalItems}
                        </span>
                      )}
                      {hasBadge && item.badge === 'new' && (
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full uppercase ${desktopSidebarCollapsed ? 'lg:absolute lg:top-1 lg:right-1 lg:ml-0' : ''}`} style={{
                          backgroundColor: 'rgb(var(--color-success))',
                          color: 'white'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="mt-auto p-4 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all ${
                desktopSidebarCollapsed ? 'lg:justify-center' : ''
              }`}
              title={desktopSidebarCollapsed ? 'Logout' : ''}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className={`font-semibold ${desktopSidebarCollapsed ? 'lg:hidden' : ''}`}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        desktopSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        {/* Header */}
        <header className="sticky top-0 z-30 shadow-sm" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden transition-colors"
              style={{ color: 'rgb(var(--color-text-secondary))' }}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:ml-0" />

            <div className="flex items-center gap-4">
              {/* Cart Badge */}
              <Link
                href="/cart"
                className="relative p-2 transition-colors"
                style={{ color: 'rgb(var(--color-text-secondary))' }}
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* Theme Switcher */}
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={pathname === '/customer/products' ? '' : 'p-4 lg:p-8'}>
          {children}
        </main>
      </div>
    </div>
  );
}
