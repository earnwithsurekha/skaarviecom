'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, Copy, Check, Eye, ShoppingCart, TrendingUp,
  ExternalLink, Users, BarChart3, Calendar, Edit2,
  Save, X, Globe
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function MyStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: ''
  });

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reseller/my-store');
      const result = await response.json();

      if (result.status === 'success') {
        setStore(result.data.store);
        setAnalytics(result.data.analytics);
        setRecentVisitors(result.data.recentVisitors);
        setFormData({
          store_name: result.data.store.store_name || '',
          store_description: result.data.store.store_description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyStoreUrl = async () => {
    if (!store?.store_url) return;
    
    try {
      await navigator.clipboard.writeText(store.store_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/reseller/my-store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.status === 'success') {
        setEditing(false);
        fetchStoreData();
      }
    } catch (error) {
      console.error('Error saving store:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      store_name: store.store_name || '',
      store_description: store.store_description || ''
    });
    setEditing(false);
  };

  const visitStore = () => {
    if (store?.store_url) {
      window.open(store.store_url, '_blank');
    }
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
          My Store
        </h1>
        <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
          Manage your personal storefront and track performance
        </p>
      </div>

      {/* Store URL Card */}
      <div 
        className="p-6 rounded-lg mb-6"
        style={{ backgroundColor: 'rgb(var(--color-surface))' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(var(--color-primary) / 0.1)' }}
            >
              <Store className="w-6 h-6" style={{ color: 'rgb(var(--color-primary))' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                Your Store URL
              </h3>
              <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                Share this link with your customers
              </p>
            </div>
          </div>
        </div>

        <div 
          className="flex items-center gap-3 p-4 rounded-lg mb-4"
          style={{ 
            backgroundColor: 'rgb(var(--color-background))',
            border: '1px solid rgb(var(--color-border))'
          }}
        >
          <Globe className="w-5 h-5 flex-shrink-0" style={{ color: 'rgb(var(--color-text) / 0.5)' }} />
          <input
            type="text"
            value={store?.store_url || ''}
            readOnly
            className="flex-1 bg-transparent outline-none"
            style={{ color: 'rgb(var(--color-text))' }}
          />
          <button
            onClick={copyStoreUrl}
            className="p-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
            title="Copy URL"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={visitStore}
            className="p-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ 
              backgroundColor: 'rgb(var(--color-surface))',
              border: '1px solid rgb(var(--color-border))',
              color: 'rgb(var(--color-text))'
            }}
            title="Visit Store"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.6)' }}>
          💡 Tip: Share your store link on social media, WhatsApp groups, or your website
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(59, 130, 246, 0.1)' }}
            >
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Total Visitors
          </h3>
          <p className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            {analytics?.total_visitors || 0}
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.5)' }}>
            {analytics?.unique_visitors || 0} unique
          </p>
        </div>

        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(34, 197, 94, 0.1)' }}
            >
              <ShoppingCart className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Total Orders
          </h3>
          <p className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            {analytics?.total_orders || 0}
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.5)' }}>
            {analytics?.orders_last_30_days || 0} this month
          </p>
        </div>

        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(234, 179, 8, 0.1)' }}
            >
              <TrendingUp className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Total Earnings
          </h3>
          <p className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            ₹{Number.parseFloat(analytics?.total_earnings || 0).toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.5)' }}>
            ₹{Number.parseFloat(analytics?.earnings_last_30_days || 0).toLocaleString()} this month
          </p>
        </div>

        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgb(168, 85, 247, 0.1)' }}
            >
              <Users className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Products Listed
          </h3>
          <p className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            {analytics?.total_products || 0}
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.5)' }}>
            Active products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
              Store Information
            </h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                  color: 'rgb(var(--color-primary))'
                }}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-surface))',
                    border: '1px solid rgb(var(--color-border))',
                    color: 'rgb(var(--color-text))'
                  }}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-primary))',
                    color: 'white'
                  }}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                Store Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => setFormData({...formData, store_name: e.target.value})}
                  placeholder="Enter store name"
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-background))',
                    border: '1px solid rgb(var(--color-border))',
                    color: 'rgb(var(--color-text))'
                  }}
                />
              ) : (
                <p className="px-4 py-2" style={{ color: 'rgb(var(--color-text))' }}>
                  {store?.store_name || store?.full_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                Store Description
              </label>
              {editing ? (
                <textarea
                  value={formData.store_description}
                  onChange={(e) => setFormData({...formData, store_description: e.target.value})}
                  placeholder="Tell customers about your store"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg outline-none resize-none"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-background))',
                    border: '1px solid rgb(var(--color-border))',
                    color: 'rgb(var(--color-text))'
                  }}
                />
              ) : (
                <p className="px-4 py-2" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  {store?.store_description || 'No description added yet'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                Username
              </label>
              <p className="px-4 py-2 font-mono" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                {store?.username}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Visitors */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'rgb(var(--color-text))' }}>
            Recent Visitors
          </h3>

          {recentVisitors.length > 0 ? (
            <div className="space-y-3">
              {recentVisitors.map((visitor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgb(var(--color-primary) / 0.1)' }}
                    >
                      <Users className="w-5 h-5" style={{ color: 'rgb(var(--color-primary))' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                        Visitor #{index + 1}
                      </p>
                      <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                        {new Date(visitor.visited_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
              <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                No visitors yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div 
        className="mt-6 p-6 rounded-lg"
        style={{ backgroundColor: 'rgb(var(--color-surface))' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
          📈 Grow Your Store
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              1. Add Products
            </h4>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              Save products you want to promote. They'll appear in your store automatically.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              2. Share Your Store
            </h4>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              Share your store link on WhatsApp, Facebook, Instagram, and other platforms.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              3. Track Performance
            </h4>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              Monitor visitors, orders, and earnings to optimize your store.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
