'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Package,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BecomeResellerPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  
  const [upgradeRequest, setUpgradeRequest] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check upgrade status for customers, not resellers
    if (user?.role === 'customer') {
      checkUpgradeStatus();
    } else if (user?.role === 'reseller') {
      setLoading(false);
    }
  }, [user]);

  const checkUpgradeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer/reseller-upgrade-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUpgradeRequest(data.data);
      }
    } catch (error) {
      // No upgrade request found or error - that's okay
      console.log('No upgrade request found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUpgradeRequest = async (e) => {
    e.preventDefault();
    setUpgradeLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer/request-reseller-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reseller upgrade request submitted successfully!');
        setShowUpgradeModal(false);
        setRequestReason('');
        // Refresh upgrade status
        await checkUpgradeStatus();
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      toast.error('Failed to submit upgrade request');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn Commissions',
      description: 'Get attractive margins on every sale you make',
    },
    {
      icon: Package,
      title: 'Exclusive Products',
      description: 'Access to special products with better pricing',
    },
    {
      icon: TrendingUp,
      title: 'Growth Opportunities',
      description: 'Scale your business with our support and tools',
    },
    {
      icon: Users,
      title: 'Referral Network',
      description: 'Build your own network and earn from referrals',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-3">
          <Store className="h-10 w-10" />
          Become a Reseller
        </h1>
        <p className="text-blue-100 max-w-2xl">
          Join our reseller program and start earning commissions on every sale. 
          Get access to exclusive products, special pricing, and grow your business with us!
        </p>
      </div>

      {/* Already a Reseller - Show for users who are already resellers */}
      {user?.role === 'reseller' && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Reseller Account Active</h2>
                  <p className="text-green-100 text-sm">You're already a reseller!</p>
                </div>
              </div>
              <p className="text-white/90 mb-6 max-w-2xl">
                You have an active reseller account. Access your reseller dashboard to manage products, 
                track commissions, view sales analytics, and more!
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/reseller/dashboard"
                  className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <Store className="h-5 w-5" />
                  Go to Reseller Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Request Status - Show for customers with pending/approved/rejected requests */}
      {user?.role === 'customer' && upgradeRequest && (
        <div className={`rounded-2xl shadow-xl p-8 ${
          upgradeRequest.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
          upgradeRequest.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
          'bg-gradient-to-r from-red-500 to-rose-600'
        } text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  {upgradeRequest.status === 'pending' && <Clock className="h-8 w-8" />}
                  {upgradeRequest.status === 'approved' && <CheckCircle className="h-8 w-8" />}
                  {upgradeRequest.status === 'rejected' && <XCircle className="h-8 w-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {upgradeRequest.status === 'pending' && 'Reseller Request Pending'}
                    {upgradeRequest.status === 'approved' && 'Reseller Request Approved!'}
                    {upgradeRequest.status === 'rejected' && 'Reseller Request Declined'}
                  </h2>
                  <p className="text-white/90 text-sm">
                    Submitted on {new Date(upgradeRequest.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-white/90 mb-4">
                {upgradeRequest.status === 'pending' && 'Your request to become a reseller is under review. We\'ll notify you once it\'s processed.'}
                {upgradeRequest.status === 'approved' && 'Congratulations! Your reseller account has been activated. You can now start earning commissions!'}
                {upgradeRequest.status === 'rejected' && `Your request was declined. Reason: ${upgradeRequest.rejection_reason || 'Not specified'}`}
              </p>
              {upgradeRequest.status === 'approved' && (
                <Link
                  href="/reseller/dashboard"
                  className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Go to Reseller Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              {upgradeRequest.status === 'rejected' && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="inline-flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Submit New Request
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section - Show for customers who haven't requested */}
      {user?.role === 'customer' && !upgradeRequest && (
        <>
          <div className="card">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'rgb(var(--color-text))' }}>
              Why Become a Reseller?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-lg border transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-surface))',
                      borderColor: 'rgb(var(--color-border))'
                    }}
                  >
                    <div className="flex-shrink-0">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)' }}
                      >
                        <Icon className="h-6 w-6" style={{ color: 'rgb(var(--color-primary))' }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                        {benefit.title}
                      </h3>
                      <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
                    <p className="text-pink-100 text-sm">Submit your application today</p>
                  </div>
                </div>
                <p className="text-white/90 mb-6 max-w-2xl">
                  Fill out a simple form and our team will review your application. 
                  Once approved, you'll gain immediate access to the reseller dashboard and all its features.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="inline-flex items-center gap-2 bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="h-5 w-5" />
                    Request Reseller Access
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upgrade Request Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
            <div className="sticky top-0 border-b p-6" style={{ 
              backgroundColor: 'rgb(var(--color-surface))',
              borderColor: 'rgb(var(--color-border))'
            }}>
              <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                Request Reseller Access
              </h2>
              <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Tell us why you want to become a reseller
              </p>
            </div>

            <form onSubmit={handleSubmitUpgradeRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  Why do you want to become a reseller? *
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'rgb(var(--color-background))',
                    borderColor: 'rgb(var(--color-border))',
                    color: 'rgb(var(--color-text))'
                  }}
                  placeholder="Share your business plans, experience, or reasons for wanting to join our reseller program..."
                  required
                />
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  What happens next?
                </h3>
                <ul className="text-sm space-y-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  <li>• Admin will review your request</li>
                  <li>• You'll be notified of the decision</li>
                  <li>• If approved, you'll get access to reseller dashboard</li>
                  <li>• Start earning commissions immediately!</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 border rounded-lg font-semibold transition-colors"
                  style={{
                    borderColor: 'rgb(var(--color-border))',
                    color: 'rgb(var(--color-text))'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upgradeLoading}
                  className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgradeLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
