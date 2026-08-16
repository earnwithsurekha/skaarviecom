'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, DollarSign, TrendingUp, UserCheck, Search,
  Eye, UserX, Award, Ban, CreditCard, Mail, Download,
  Edit, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { exportToCSV } from '@/lib/exportUtils';

export default function ResellersManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState([]);
  const [stats, setStats] = useState({
    totalResellers: 0,
    activeResellers: 0,
    totalCommissionsPaid: 0,
    pendingWithdrawals: 0,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    sortBy: 'registrationDate',
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState('');
  const [referralTree, setReferralTree] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    resellerType: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchResellers();
  }, [filters.status, filters.type, filters.sortBy, pagination.page]);

  const fetchResellers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/admin');
        return;
      }

      const params = new URLSearchParams({
        status: filters.status,
        type: filters.type,
        sortBy: filters.sortBy,
        page: pagination.page,
        limit: 20,
        search: filters.search,
      });

      const response = await fetch(`/api/admin/resellers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch resellers');

      const data = await response.json();
      setResellers(data.data.resellers || []);
      setPagination(data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      
      // Calculate stats
      const total = data.data.resellers?.length || 0;
      const active = data.data.resellers?.filter(r => r.status === 'active').length || 0;
      const commissions = data.data.resellers?.reduce((sum, r) => sum + (parseFloat(r.totalEarnings) || 0), 0) || 0;

      setStats({
        totalResellers: total,
        activeResellers: active,
        totalCommissionsPaid: commissions,
        pendingWithdrawals: 0, // This would come from backend
      });
    } catch (error) {
      console.error('Resellers fetch error:', error);
      toast.error('Failed to load resellers');
    } finally {
      setLoading(false);
    }
  };

  const fetchResellerProfile = async (resellerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/resellers/${resellerId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch reseller profile');

      const data = await response.json();
      setSelectedReseller(data.data);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Failed to load reseller profile');
    }
  };

  const fetchReferralTree = async (resellerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/resellers/${resellerId}/referrals`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch referral tree');

      const data = await response.json();
      setReferralTree(data.data.referrals || []);
      setShowReferralsModal(true);
    } catch (error) {
      console.error('Referral tree fetch error:', error);
      toast.error('Failed to load referral tree');
    }
  };

  const handleAction = async (actionType, reason = '') => {
    if (!selectedReseller) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/resellers/${selectedReseller.id}/${actionType}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) throw new Error(`Failed to ${actionType} reseller`);

      toast.success(`Reseller ${actionType}d successfully`);
      setShowActionModal(false);
      setShowProfileModal(false);
      setAction('');
      fetchResellers();
    } catch (error) {
      console.error('Action error:', error);
      toast.error(`Failed to ${actionType} reseller`);
    }
  };

  const handleEditReseller = (reseller) => {
    setSelectedReseller(reseller);
    setEditForm({
      fullName: reseller.fullName || '',
      email: reseller.email || '',
      mobile: reseller.phoneNumber || '',
      resellerType: reseller.resellerType || 'individual',
      city: reseller.city || '',
      state: reseller.state || '',
      pincode: reseller.pincode || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReseller) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/resellers/${selectedReseller.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update reseller');

      toast.success('Reseller details updated successfully');
      setShowEditModal(false);
      fetchResellers();
    } catch (error) {
      console.error('Update reseller error:', error);
      toast.error('Failed to update reseller details');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReseller = async (resellerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/resellers/${resellerId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to approve reseller');

      toast.success('Reseller approved successfully');
      fetchResellers();
    } catch (error) {
      console.error('Approve reseller error:', error);
      toast.error('Failed to approve reseller');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchResellers();
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      search: '',
      sortBy: 'registrationDate',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const styles = {
      free: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      verified: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      premium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[type?.toLowerCase()] || styles.free}`}>
        {type?.toUpperCase() || 'FREE'}
      </span>
    );
  };

  const statsCards = [
    {
      title: 'Total Resellers',
      value: stats.totalResellers,
      icon: Users,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Resellers',
      value: `${stats.activeResellers} (${stats.totalResellers > 0 ? Math.round((stats.activeResellers / stats.totalResellers) * 100) : 0}%)`,
      icon: UserCheck,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Total Commissions',
      value: formatCurrency(stats.totalCommissionsPaid),
      icon: DollarSign,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Pending Withdrawals',
      value: formatCurrency(stats.pendingWithdrawals),
      icon: TrendingUp,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  if (loading && resellers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Resellers Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage resellers and track referral networks
          </p>
        </div>
        <button
          onClick={() => {
            if (resellers.length === 0) {
              toast.error('No resellers to export');
              return;
            }
            const headers = [
              { key: 'fullName', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'resellerType', label: 'Type' },
              { key: 'status', label: 'Status' },
              { key: 'totalEarnings', label: 'Total Earnings (₹)' },
            ];
            exportToCSV(resellers, headers, `resellers-export-${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Resellers exported successfully');
          }}
          className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 flex items-center gap-2"
          style={{ backgroundColor: 'rgb(var(--color-primary))' }}
        >
          <Download className="w-4 h-4" />
          Export Resellers
        </button>
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, code..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          >
            <option value="all">All Types</option>
            <option value="free">Free</option>
            <option value="verified">Verified</option>
            <option value="premium">Premium</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'rgb(var(--color-primary))' }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Resellers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reseller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Referrals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {resellers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No resellers found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try adjusting your filters or search term
                    </p>
                  </td>
                </tr>
              ) : (
                resellers.map((reseller) => (
                  <tr
                    key={reseller.userId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {reseller.fullName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {reseller.resellerCode || `SKR${reseller.userId}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {reseller.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {reseller.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(reseller.resellerType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(reseller.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(reseller.totalEarnings || 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Pending: {formatCurrency(reseller.pendingEarnings || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {reseller.totalOrders || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        {reseller.referralCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(reseller.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchResellerProfile(reseller.userId)}
                          className="hover:opacity-70 transition-opacity"
                          style={{ color: 'rgb(var(--color-primary))' }}
                          title="View Profile"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditReseller(reseller)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                          title="Edit Details"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {reseller.accountStatus !== 'active' && (
                          <button
                            onClick={() => handleApproveReseller(reseller.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="Approve Reseller"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => fetchReferralTree(reseller.id)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                          title="View Referrals"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reseller Profile Modal */}
      {showProfileModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedReseller.fullName}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Reseller ID: {selectedReseller.resellerCode || `SKR${selectedReseller.userId}`}
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Ban className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Type */}
              <div className="flex items-center gap-4">
                {getTypeBadge(selectedReseller.resellerType)}
                {getStatusBadge(selectedReseller.status)}
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Contact Info</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Email:</span> {selectedReseller.email}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Phone:</span> {selectedReseller.phoneNumber}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Location:</span> {selectedReseller.city}, {selectedReseller.state}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Bank Details</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Account:</span> ****{selectedReseller.accountNumber?.slice(-4) || 'N/A'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">IFSC:</span> {selectedReseller.ifscCode || 'N/A'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">UPI:</span> {selectedReseller.upiId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Earnings Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Earnings Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {formatCurrency(selectedReseller.totalEarnings || 0)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                      {formatCurrency(selectedReseller.pendingEarnings || 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Withdrawn</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {formatCurrency(selectedReseller.withdrawnAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedReseller.status === 'active' ? (
                  <button
                    onClick={() => {
                      setAction('suspend');
                      setShowActionModal(true);
                    }}
                    className="btn btn-danger"
                  >
                    <UserX className="w-4 h-4" />
                    Suspend Reseller
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAction('activate');
                      setShowActionModal(true);
                    }}
                    className="btn btn-success"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activate Reseller
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleEditReseller(selectedReseller);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </button>

                <button
                  onClick={() => toast('Upgrade feature coming soon')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  Upgrade Type
                </button>

                <button
                  onClick={() => fetchReferralTree(selectedReseller.id)}
                  className="btn btn-primary"
                >
                  <Users className="w-4 h-4" />
                  View Referrals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Tree Modal */}
      {showReferralsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Referral Network
              </h2>
              <button
                onClick={() => setShowReferralsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Ban className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {referralTree.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">No referrals yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referralTree.map((referral, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {referral.fullName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {referral.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(referral.totalEarnings || 0)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {referral.totalOrders || 0} orders
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Reseller Modal */}
      {showEditModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Reseller Details
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Ban className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reseller Type
                  </label>
                  <select
                    value={editForm.resellerType}
                    onChange={(e) => setEditForm({ ...editForm, resellerType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter pincode"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && selectedReseller && (
        <ConfirmModal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setAction('');
          }}
          onConfirm={handleAction}
          title={action === 'suspend' ? 'Suspend Reseller' : 'Activate Reseller'}
          message={
            action === 'suspend'
              ? 'Are you sure you want to suspend this reseller? They will not be able to generate new sales links.'
              : 'Are you sure you want to activate this reseller? They will be able to generate sales links again.'
          }
          type={action === 'suspend' ? 'danger' : 'info'}
          showInput={action === 'suspend'}
          inputLabel="Reason for suspension"
          inputPlaceholder="Enter reason (minimum 20 characters)"
          inputRequired={action === 'suspend'}
        />
      )}
    </div>
  );
}
