'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MousePointerClick, ShoppingBag, TrendingUp, DollarSign,
  Link2, Copy, Check, Eye, Users, Package, Calendar,
  BarChart3, Activity
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ReferralLinksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalOrders: 0,
    totalEarnings: 0,
    conversionRate: 0
  });
  const [clicksData, setClicksData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [copied, setCopied] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    fetchReferralStats();
  }, [selectedPeriod]);

  const fetchReferralStats = async () => {
    setLoading(true);
    try {
      // Fetch reseller code
      const codeResponse = await fetch('/api/reseller/referrals/my-code');
      const codeData = await codeResponse.json();
      
      if (codeData.status === 'success') {
        setReferralCode(codeData.data.reseller_code);
        
        // Fetch click statistics
        const statsResponse = await fetch(`/api/track/click-stats/${codeData.data.reseller_code}`);
        const statsData = await statsResponse.json();
        
        if (statsData.status === 'success') {
          setStats({
            totalClicks: statsData.data.stats.total_clicks || 0,
            uniqueVisitors: statsData.data.stats.unique_visitors || 0,
            convertedClicks: statsData.data.stats.converted_clicks || 0,
            conversionRate: statsData.data.stats.total_clicks > 0 
              ? ((statsData.data.stats.converted_clicks / statsData.data.stats.total_clicks) * 100).toFixed(2)
              : 0
          });
          setProductPerformance(statsData.data.productBreakdown || []);
        }
      }

      // Fetch dashboard stats for earnings and orders
      const dashboardResponse = await fetch('/api/reseller/dashboard/stats');
      const dashboardData = await dashboardResponse.json();
      
      if (dashboardData.status === 'success') {
        setStats(prev => ({
          ...prev,
          totalOrders: dashboardData.data.totalOrders || 0,
          totalEarnings: dashboardData.data.totalEarnings || 0
        }));
      }

    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateSampleLink = (productId = '123') => {
    return `${window.location.origin}/p/product-${productId}?ref=${referralCode}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
          Referral Link Tracking
        </h1>
        <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
          Monitor your referral link performance, clicks, and conversions
        </p>
      </div>

      {/* Referral Code Card */}
      <div 
        className="p-6 rounded-lg mb-8"
        style={{ backgroundColor: 'rgb(var(--color-surface))' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
              Your Unique Referral Code
            </h2>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              Add this code to any product link to track clicks and earn commissions
            </p>
          </div>
          <Link2 className="w-8 h-8" style={{ color: 'rgb(var(--color-primary))' }} />
        </div>

        <div 
          className="flex items-center gap-3 p-4 rounded-lg mb-4"
          style={{ 
            backgroundColor: 'rgb(var(--color-background))',
            border: '1px solid rgb(var(--color-border))'
          }}
        >
          <code 
            className="flex-1 text-2xl font-bold"
            style={{ color: 'rgb(var(--color-primary))' }}
          >
            {referralCode}
          </code>
          <button
            onClick={copyReferralCode}
            className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgb(var(--color-primary))',
              color: 'white'
            }}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Code
              </>
            )}
          </button>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-primary) / 0.1)' }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            Example Referral Link:
          </p>
          <code className="text-xs break-all" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            {generateSampleLink()}
          </code>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Clicks */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(59, 130, 246, 0.1)' }}
            >
              <MousePointerClick className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Total Link Clicks
          </h3>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            {stats.totalClicks.toLocaleString()}
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-text) / 0.5)' }}>
            {stats.uniqueVisitors} unique visitors
          </p>
        </div>

        {/* Orders Generated */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(34, 197, 94, 0.1)' }}
            >
              <ShoppingBag className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Orders Generated
          </h3>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            {stats.totalOrders.toLocaleString()}
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-text) / 0.5)' }}>
            {stats.convertedClicks} converted clicks
          </p>
        </div>

        {/* Conversion Rate */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(168, 85, 247, 0.1)' }}
            >
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Conversion Rate
          </h3>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            {stats.conversionRate}%
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-text) / 0.5)' }}>
            clicks to orders
          </p>
        </div>

        {/* Total Earnings */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(234, 179, 8, 0.1)' }}
            >
              <DollarSign className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Earnings Generated
          </h3>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            ₹{stats.totalEarnings.toLocaleString()}
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-text) / 0.5)' }}>
            from referral orders
          </p>
        </div>
      </div>

      {/* Product Performance Table */}
      <div 
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: 'rgb(var(--color-surface))' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
            <BarChart3 className="w-6 h-6" />
            Product Performance
          </h2>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Track which products get the most clicks and conversions
          </p>
        </div>

        {productPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'rgb(var(--color-background))' }}>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Total Clicks
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Conversions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Conversion Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.map((product, index) => (
                  <tr 
                    key={product.id}
                    className="border-b"
                    style={{ borderColor: 'rgb(var(--color-border))' }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'rgb(var(--color-background))' }}
                        >
                          <Package className="w-5 h-5" style={{ color: 'rgb(var(--color-text) / 0.5)' }} />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="w-4 h-4" style={{ color: 'rgb(var(--color-text) / 0.5)' }} />
                        <span className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                          {product.clicks}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" style={{ color: 'rgb(var(--color-text) / 0.5)' }} />
                        <span className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                          {product.conversions}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: product.clicks > 0 && (product.conversions / product.clicks * 100) >= 10
                            ? 'rgb(34, 197, 94, 0.1)'
                            : 'rgb(239, 68, 68, 0.1)',
                          color: product.clicks > 0 && (product.conversions / product.clicks * 100) >= 10
                            ? 'rgb(34, 197, 94)'
                            : 'rgb(239, 68, 68)'
                        }}
                      >
                        {product.clicks > 0 ? ((product.conversions / product.clicks) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/reseller/products/${product.id}`)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'rgb(var(--color-primary))' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              No Click Data Yet
            </h3>
            <p className="mb-6" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              Start sharing your referral links to track product performance
            </p>
            <button
              onClick={() => router.push('/reseller/products')}
              className="px-6 py-3 rounded-lg font-medium"
              style={{ 
                backgroundColor: 'rgb(var(--color-primary))',
                color: 'white'
              }}
            >
              Browse Products
            </button>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div 
        className="mt-8 p-6 rounded-lg"
        style={{ backgroundColor: 'rgb(var(--color-surface))' }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
          📋 How Referral Link Tracking Works
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
            >
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                Generate Referral Link
              </h3>
              <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                Visit any product in the marketplace and click "Generate Referral Link" to create your unique tracking link.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
            >
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                Share with Customers
              </h3>
              <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                Share your referral link via WhatsApp, Facebook, Telegram, or any other channel. Every click is automatically tracked.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
            >
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                Earn Commissions
              </h3>
              <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                When customers purchase through your link, you earn your profit margin automatically. Track all earnings in your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
