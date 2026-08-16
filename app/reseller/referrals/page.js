'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Link2,
  Copy,
  Share2,
  TrendingUp,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  Network
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    totalEarnings: 0,
    totalOrders: 0
  });

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      // Fetch reseller code
      const codeResponse = await fetch('/api/reseller/referrals/my-code', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        if (codeData.status === 'success') {
          setReferralCode(codeData.data.resellerCode);
        }
      }

      // Fetch referrals list
      const response = await fetch('/api/reseller/referrals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch referrals');

      const data = await response.json();
      
      if (data.status === 'success') {
        setReferrals(data.data.referrals || []);
        
        // Calculate comprehensive stats
        const referralList = data.data.referrals || [];
        const totalReferrals = referralList.length;
        const activeReferrals = referralList.filter(r => r.account_status === 'active').length;
        const pendingReferrals = referralList.filter(r => r.account_status === 'pending_verification').length;
        const totalEarnings = referralList.reduce((sum, r) => sum + Number.parseFloat(r.total_earnings || 0), 0);
        const totalOrders = referralList.reduce((sum, r) => sum + parseInt(r.total_orders || 0, 10), 0);
        
        setStats({
          totalReferrals,
          activeReferrals,
          pendingReferrals,
          totalEarnings,
          totalOrders
        });
      }

    } catch (error) {
      console.error('Referrals fetch error:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const generateRegistrationLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register/reseller?sponsor=${referralCode}`;
  };

  const statsCards = [
    {
      title: 'Direct Referrals',
      value: stats.totalReferrals,
      subtitle: 'Total referred',
      icon: Users,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-900/30'
    },
    {
      title: 'Active Referrals',
      value: stats.activeReferrals,
      subtitle: 'Currently active',
      icon: CheckCircle,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-900/30'
    },
    {
      title: 'Pending Referrals',
      value: stats.pendingReferrals,
      subtitle: 'Awaiting verification',
      icon: Clock,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-900/30'
    },
    {
      title: 'Referral Earnings',
      value: `₹${stats.totalEarnings.toFixed(2)}`,
      subtitle: 'From network',
      icon: DollarSign,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-900/30'
    },
    {
      title: 'Network Orders',
      value: stats.totalOrders,
      subtitle: 'Total orders',
      icon: Award,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-900/30'
    }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      active: {
        icon: CheckCircle,
        label: 'Active',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      pending_verification: {
        icon: Clock,
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      inactive: {
        icon: XCircle,
        label: 'Inactive',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      },
      suspended: {
        icon: XCircle,
        label: 'Suspended',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }
    };
    return configs[status] || configs.inactive;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Network className="h-8 w-8" style={{ color: 'rgb(var(--color-primary))' }} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Referral Program
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Build your network and earn from referrals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border-2 ${card.borderColor}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Referral Link Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Referral Code
          </h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Referral Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-lg"
              />
              <button
                onClick={() => copyToClipboard(referralCode)}
                className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: 'rgb(var(--color-primary))' }}
              >
                <Copy className="h-5 w-5" />
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Registration Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generateRegistrationLink()}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={() => copyToClipboard(generateRegistrationLink())}
                className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: 'rgb(var(--color-primary))' }}
              >
                <Copy className="h-5 w-5" />
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Share this link to recruit new resellers under your network
            </p>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Referral Network
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Direct referrals in your network • Future MLM ready
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Network className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-400">
                Level 1
              </span>
            </div>
          </div>
        </div>

        {referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Referral Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Join Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Their Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Your Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {referrals.map((referral) => {
                  const statusConfig = getStatusConfig(referral.account_status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr key={referral.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {referral.full_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                            Code: {referral.reseller_code}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{referral.email}</p>
                          <p className="text-gray-600 dark:text-gray-400">{referral.mobile}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(referral.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {referral.total_orders || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₹{Number.parseFloat(referral.total_earnings || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          ₹{(Number.parseFloat(referral.total_earnings || 0) * 0.05).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${statusConfig.className}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Referrals Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start sharing your referral code to grow your network
            </p>
            <button
              onClick={() => copyToClipboard(generateRegistrationLink())}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'rgb(var(--color-primary))' }}
            >
              <Share2 className="h-5 w-5" />
              Share Referral Link
            </button>
          </div>
        )}
      </div>

      {/* Network Expansion Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-900/30">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Future Network Expansion Ready
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Your referral system is ready for multi-level marketing (MLM) expansion. Track your direct referrals now, and watch your network grow as the platform evolves.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Level 1</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your direct referrals • Currently tracking
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Level 2</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Coming soon • Their referrals
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Level 3+</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Future expansion • Deep network
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
