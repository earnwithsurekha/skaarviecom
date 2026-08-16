'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  Wallet,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    totalEarnings: 0,
    pendingSettlements: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchLowStockProducts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/manufacturer');
        return;
      }

      const response = await fetch('/api/manufacturers/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        setStats({
          totalProducts: result.data.totalProducts || 0,
          activeProducts: result.data.activeProducts || 0,
          pendingProducts: result.data.pendingProducts || 0,
          totalOrders: result.data.totalOrders || 0,
          totalSales: result.data.totalSales || 0,
          totalEarnings: result.data.totalEarnings || 0,
          pendingSettlements: result.data.pendingSettlements || 0,
        });
        setRecentOrders(result.data.recentOrders || []);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch('/api/inventory?low_stock_only=true&limit=5');
      const data = await response.json();
      if (data.status === 'success') {
        setLowStockProducts(data.data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const statsCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'primary',
      subtitle: 'All products'
    },
    {
      title: 'Active Products',
      value: stats.activeProducts,
      icon: CheckCircle,
      color: 'success',
      subtitle: 'Live on marketplace'
    },
    {
      title: 'Pending Products',
      value: stats.pendingProducts,
      icon: Clock,
      color: 'warning',
      subtitle: 'Awaiting approval'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'primary',
      subtitle: 'All time orders'
    },
    {
      title: 'Total Sales',
      value: formatCurrency(stats.totalSales),
      icon: DollarSign,
      color: 'success',
      subtitle: 'Total revenue'
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats.totalEarnings),
      icon: TrendingUp,
      color: 'success',
      subtitle: 'After commission'
    },
    {
      title: 'Pending Settlements',
      value: formatCurrency(stats.pendingSettlements),
      icon: Wallet,
      color: 'warning',
      subtitle: 'To be settled'
    },
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      'delivered': 'badge-success',
      'shipped': 'badge-primary',
      'processing': 'badge-warning',
      'new': 'badge-info',
      'cancelled': 'badge-danger',
      'returned': 'badge-secondary',
    };
    return statusMap[status?.toLowerCase()] || 'badge-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: 'rgb(var(--color-primary))' }} />
          <p style={{ color: 'rgb(var(--color-text-secondary))' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Welcome back! Here's your overview</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button 
            onClick={() => router.push('/manufacturer/products/add')}
            className="btn btn-primary"
          >
            <Package className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Stats Grid - 7 cards in responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.title}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>{stat.title}</p>
                    <h3 className="text-2xl font-bold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                      {stat.value}
                    </h3>
                    <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>{stat.subtitle}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)' }}>
                    <Icon className="w-6 h-6" style={{ color: 'rgb(var(--color-primary))' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="card border-l-4 border-yellow-500" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                    Low Stock Alert
                  </h2>
                  <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                    {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low
                  </p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/manufacturer/inventory?low_stock_only=true')}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                  onClick={() => router.push('/manufacturer/inventory')}
                >
                  <div className="flex items-center gap-3">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>{product.name}</p>
                      <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        SKU: {product.sku || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">
                      {product.availableStock} / {product.low_stock_threshold}
                    </p>
                    <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Available / Threshold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>Recent Orders</h2>
              <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>Latest orders from resellers</p>
            </div>
            <button 
              onClick={() => router.push('/manufacturer/orders')}
              className="text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: 'rgb(var(--color-primary))' }}
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-8">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order, index) => (
                    <tr 
                      key={order.id || index}
                      onClick={() => router.push(`/manufacturer/orders/${order.id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="font-medium text-primary-600">{order.id}</td>
                      <td>{order.product}</td>
                      <td>{order.quantity}</td>
                      <td>₹{order.amount?.toLocaleString()}</td>
                      <td className="text-sm text-gray-600">{formatDate(order.orderedAt)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(order.status)}`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
