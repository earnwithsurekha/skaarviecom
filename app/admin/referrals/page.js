'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, TrendingUp, DollarSign, Award, Search, Eye, ChevronRight, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferralManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [topSponsors, setTopSponsors] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeSponsors: 0,
    totalReferralRevenue: 0,
    totalReferralEarnings: 0,
  });
  const [filters, setFilters] = useState({ search: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [referralTree, setReferralTree] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    fetchReferrals();
    fetchTopSponsors();
  }, [pagination.page, filters.search]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/admin');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        search: filters.search,
      });

      const response = await fetch(`/api/admin/referrals?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch referrals');

      const data = await response.json();

      setReferrals(data.data.referrals || []);
      setPagination(data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      setStats(data.data.stats || {
        totalReferrals: 0,
        activeSponsors: 0,
        totalReferralRevenue: 0,
        totalReferralEarnings: 0,
      });
    } catch (error) {
      console.error('Referrals fetch error:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopSponsors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/referrals/top-sponsors?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch top sponsors');

      const data = await response.json();
      setTopSponsors(data.data || []);
    } catch (error) {
      console.error('Top sponsors fetch error:', error);
    }
  };

  const fetchReferralTree = async (sponsorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/referrals/tree/${sponsorId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch referral tree');

      const data = await response.json();
      setReferralTree(data.data);
    } catch (error) {
      console.error('Referral tree fetch error:', error);
      toast.error('Failed to load referral tree');
    }
  };

  const handleViewTree = async (sponsor) => {
    setSelectedSponsor(sponsor);
    setShowTreeModal(true);
    setExpandedNodes(new Set());
    await fetchReferralTree(sponsor.sponsorId);
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchReferrals();
  };

  const clearFilters = () => {
    setFilters({ search: '' });
    setPagination({ ...pagination, page: 1 });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statsCards = [
    {
      title: 'Total Referrals',
      value: formatNumber(stats.totalReferrals),
      icon: Users,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Sponsors',
      value: formatNumber(stats.activeSponsors),
      icon: Award,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Referral Revenue',
      value: formatCurrency(stats.totalReferralRevenue),
      icon: TrendingUp,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Referral Earnings',
      value: formatCurrency(stats.totalReferralEarnings),
      icon: DollarSign,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Referral Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage referral network
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by sponsor or referral name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            Search
          </button>
          {filters.search && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-6 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referrals Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Referrals ({pagination.total})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Referral Reseller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sponsor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : referrals.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">No referrals found</p>
                    </td>
                  </tr>
                ) : (
                  referrals.map((referral) => (
                    <tr key={referral.resellerId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {referral.referralName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {referral.referralCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {referral.sponsorName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {referral.sponsorCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(referral.referralRevenue)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {referral.referralOrders} orders
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(referral.referralEarnings)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewTree({ ...referral, sponsorId: referral.sponsorId })}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Referral Tree"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Top Sponsors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Sponsors
            </h3>
          </div>
          <div className="p-6">
            {topSponsors.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No sponsors yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topSponsors.map((sponsor, index) => (
                  <div
                    key={sponsor.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        index === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
                        index === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {sponsor.sponsorName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {sponsor.totalReferrals} referrals
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(sponsor.totalRevenue)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sponsor.totalOrders} orders
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Referral Tree Modal */}
      {showTreeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Referral Tree - {referralTree?.sponsor?.full_name}
                </h3>
                <button
                  onClick={() => {
                    setShowTreeModal(false);
                    setReferralTree(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              {!referralTree ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sponsor Node */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {referralTree.sponsor.full_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {referralTree.sponsor.reseller_code} • {referralTree.sponsor.email}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(referralTree.sponsor.total_earnings)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Total Earnings
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Level 1 Referrals */}
                  {referralTree.referrals && referralTree.referrals.length > 0 ? (
                    <div className="ml-8 space-y-3">
                      {referralTree.referrals.map((level1) => (
                        <div key={level1.id} className="space-y-2">
                          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {level1.subReferrals && level1.subReferrals.length > 0 && (
                                  <button
                                    onClick={() => toggleNode(level1.id)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    {expandedNodes.has(level1.id) ? (
                                      <ChevronDown className="w-5 h-5" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5" />
                                    )}
                                  </button>
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {level1.full_name}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {level1.reseller_code} • {level1.email}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(level1.revenue)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {level1.orderCount} orders • {level1.referralCount} referrals
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Level 2 Referrals */}
                          {expandedNodes.has(level1.id) && level1.subReferrals && level1.subReferrals.length > 0 && (
                            <div className="ml-8 space-y-2">
                              {level1.subReferrals.map((level2) => (
                                <div key={level2.id} className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {level2.full_name}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {level2.reseller_code} • {level2.email}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(level2.revenue)}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {level2.orderCount} orders
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No referrals yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
