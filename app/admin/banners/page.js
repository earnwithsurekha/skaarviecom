'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Image as ImageIcon, Plus, Edit, Trash2, Eye, EyeOff,
  BarChart3, MousePointer, Monitor, Tag, Calendar, Gift,
  Star, Search, Filter, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function BannersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [stats, setStats] = useState({
    totalBanners: 0,
    activeBanners: 0,
    homepageBanners: 0,
    promotionalBanners: 0,
    festivalBanners: 0,
    featuredBanners: 0,
    totalClicks: 0,
    totalViews: 0,
  });
  const [filters, setFilters] = useState({
    bannerType: 'all',
    isActive: 'all',
    search: '',
    sortBy: 'display_order',
    sortOrder: 'ASC',
  });
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bannerType: 'homepage',
    linkUrl: '',
    linkType: 'none',
    linkId: '',
    isActive: true,
    startDate: '',
    endDate: '',
    displayOrder: 0,
    target: '_self',
    image: null,
    imagePreview: '',
  });

  useEffect(() => {
    fetchBanners();
  }, [pagination.page, filters.bannerType, filters.isActive, filters.search, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((currentFilters) => (
        currentFilters.search === searchInput
          ? currentFilters
          : { ...currentFilters, search: searchInput }
      ));
      setPagination((currentPagination) => (
        currentPagination.page === 1
          ? currentPagination
          : { ...currentPagination, page: 1 }
      ));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchBanners = async () => {
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
        bannerType: filters.bannerType,
        isActive: filters.isActive,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await fetch(`/api/admin/banners?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch banners');

      const data = await response.json();

      setBanners(data.data.banners || []);
      setPagination(data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      setStats(data.data.stats || {});
    } catch (error) {
      console.error('Banners fetch error:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('bannerType', formData.bannerType);
      formDataToSend.append('linkUrl', formData.linkUrl);
      formDataToSend.append('linkType', formData.linkType);
      formDataToSend.append('linkId', formData.linkId);
      formDataToSend.append('isActive', formData.isActive);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('displayOrder', formData.displayOrder);
      formDataToSend.append('target', formData.target);

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      } else if (!editingBanner) {
        toast.error('Please select an image');
        return;
      }

      const url = editingBanner 
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners';
      
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) throw new Error('Failed to save banner');

      toast.success(`Banner ${editingBanner ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Save banner error:', error);
      toast.error(`Failed to ${editingBanner ? 'update' : 'create'} banner`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete banner');

      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      console.error('Delete banner error:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/banners/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to toggle status');

      toast.success('Banner status updated');
      fetchBanners();
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      bannerType: banner.banner_type,
      linkUrl: banner.link_url || '',
      linkType: banner.link_type || 'none',
      linkId: banner.link_id || '',
      isActive: banner.is_active,
      startDate: banner.start_date ? banner.start_date.split('T')[0] : '',
      endDate: banner.end_date ? banner.end_date.split('T')[0] : '',
      displayOrder: banner.display_order,
      target: banner.target || '_self',
      image: null,
      imagePreview: banner.image_url,
    });
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      bannerType: 'homepage',
      linkUrl: '',
      linkType: 'none',
      linkId: '',
      isActive: true,
      startDate: '',
      endDate: '',
      displayOrder: 0,
      target: '_self',
      image: null,
      imagePreview: '',
    });
  };

  const statsCards = [
    {
      title: 'Total Banners',
      value: stats.totalBanners,
      icon: ImageIcon,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      subtitle: `${stats.activeBanners} active`,
    },
    {
      title: 'Homepage',
      value: stats.homepageBanners,
      icon: Monitor,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      subtitle: 'Main banners',
    },
    {
      title: 'Promotional',
      value: stats.promotionalBanners,
      icon: Tag,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      subtitle: 'Promo banners',
    },
    {
      title: 'Festival',
      value: stats.festivalBanners,
      icon: Gift,
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
      subtitle: 'Festival offers',
    },
    {
      title: 'Featured',
      value: stats.featuredBanners,
      icon: Star,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      subtitle: 'Featured products',
    },
    {
      title: 'Total Views',
      value: new Intl.NumberFormat('en-IN').format(stats.totalViews),
      icon: Eye,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      subtitle: `${new Intl.NumberFormat('en-IN').format(stats.totalClicks)} clicks`,
    },
  ];

  const bannerTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'homepage', label: 'Homepage' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'festival', label: 'Festival' },
    { value: 'featured', label: 'Featured' },
  ];

  const getBannerTypeBadge = (type) => {
    const badges = {
      homepage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      promotional: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      festival: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      featured: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return badges[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  if (loading && banners.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Banner Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage homepage, promotional, festival, and featured product banners
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
          style={{ backgroundColor: 'rgb(var(--color-primary))' }}
        >
          <Plus className="h-5 w-5" />
          Add Banner
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Banner Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Banner Type
            </label>
            <select
              value={filters.bannerType}
              onChange={(e) => setFilters({ ...filters, bannerType: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            >
              {bannerTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search banners..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Banners Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Banner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No banners found. Create your first banner to get started.
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {banner.title}
                          </p>
                          {banner.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {banner.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Order: {banner.display_order}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBannerTypeBadge(banner.banner_type)}`}>
                        {banner.banner_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {banner.start_date && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Start: {new Date(banner.start_date).toLocaleDateString()}
                          </p>
                        )}
                        {banner.end_date && (
                          <p className="text-gray-600 dark:text-gray-400">
                            End: {new Date(banner.end_date).toLocaleDateString()}
                          </p>
                        )}
                        {!banner.start_date && !banner.end_date && (
                          <p className="text-gray-400 dark:text-gray-500">Always active</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Eye className="h-4 w-4" />
                          <span>{banner.view_count}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <MousePointer className="h-4 w-4" />
                          <span>{banner.click_count}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(banner.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          banner.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {banner.is_active ? (
                          <>
                            <Eye className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="Edit"
                          aria-label={`Edit ${banner.title}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Delete"
                          aria-label={`Delete ${banner.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
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
          <div className="portal-pagination flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-2xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800"
            style={{ maxHeight: 'calc(100dvh - 4rem)' }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close banner editor"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
              {/* Image Upload */}
              <div>
                <label htmlFor="banner-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banner Image *
                </label>
                <div className="space-y-3">
                  {formData.imagePreview && (
                    <div className="relative aspect-[3/1] w-full overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                      <Image
                        src={formData.imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <label 
                    htmlFor="banner-image"
                    className="block w-full cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
                         style={{ backgroundColor: 'rgb(var(--color-primary))' }}>
                      <ImageIcon className="h-4 w-4" />
                      Choose Banner Image
                    </div>
                    <input
                      id="banner-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {formData.image && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Selected: {formData.image.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended: 1920 x 640 px (3:1). JPG, PNG, GIF, or WebP up to 5MB.
                  </p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  placeholder="Enter banner title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  placeholder="Enter banner description"
                />
              </div>

              {/* Banner Type & Display Order */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Banner Type *
                  </label>
                  <select
                    value={formData.bannerType}
                    onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  >
                    <option value="homepage">Homepage</option>
                    <option value="promotional">Promotional</option>
                    <option value="festival">Festival</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Link URL & Target */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Link URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Open In
                  </label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  >
                    <option value="_self">Same Tab</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
              </div>

              {/* Start & End Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Set as active
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 font-medium"
                  style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
