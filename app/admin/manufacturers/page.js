'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import ManufacturerCard from '@/components/admin/ManufacturerCard';
import toast from 'react-hot-toast';
import { ListSkeleton } from '@/components/SkeletonLoader';

export default function ManufacturersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [manufacturers, setManufacturers] = useState([]);
  const [filteredManufacturers, setFilteredManufacturers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchManufacturers();
  }, []);

  useEffect(() => {
    filterManufacturers();
  }, [manufacturers, activeFilter, searchQuery]);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/admin');
        return;
      }

      const response = await fetch('/api/manufacturers/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch manufacturers');
      }

      const data = await response.json();
      const manufacturersData = Array.isArray(data.data) ? data.data : [];
      setManufacturers(manufacturersData);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load manufacturers');
      setManufacturers([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const filterManufacturers = () => {
    // Ensure manufacturers is always an array
    if (!Array.isArray(manufacturers)) {
      setFilteredManufacturers([]);
      return;
    }

    let filtered = [...manufacturers];

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(m => m.approvalStatus === activeFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.companyName?.toLowerCase().includes(query) ||
          m.brandName?.toLowerCase().includes(query) ||
          m.contactPerson?.toLowerCase().includes(query)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredManufacturers(filtered);
  };

  // Ensure manufacturers is always an array for filters
  const safeManufacturers = Array.isArray(manufacturers) ? manufacturers : [];

  const filters = [
    { id: 'all', label: 'All', count: safeManufacturers.length },
    { id: 'pending', label: 'Pending', count: safeManufacturers.filter(m => m.approvalStatus === 'pending').length },
    { id: 'approved', label: 'Approved', count: safeManufacturers.filter(m => m.approvalStatus === 'approved').length },
    { id: 'rejected', label: 'Rejected', count: safeManufacturers.filter(m => m.approvalStatus === 'rejected').length },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        </div>
        <ListSkeleton items={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>Manufacturers</h1>
        <p className="mt-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>Manage and review manufacturer applications</p>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
          <input
            type="text"
            placeholder="Search by company name, brand, or contact person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-12"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={activeFilter === filter.id ? {
                backgroundColor: 'rgb(var(--color-primary))',
                color: 'white'
              } : {
                backgroundColor: 'rgb(var(--color-surface))',
                color: 'rgb(var(--color-text))'
              }}
            >
              {filter.label}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white bg-opacity-20">
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <p className="text-sm mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Showing {filteredManufacturers.length} manufacturer{filteredManufacturers.length !== 1 ? 's' : ''}
        </p>

        {filteredManufacturers.length === 0 ? (
          <div className="card p-12 text-center">
            <Filter className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              No manufacturers found
            </h3>
            <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'No manufacturers match the selected filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredManufacturers.map((manufacturer) => (
              <ManufacturerCard
                key={manufacturer.id}
                manufacturer={manufacturer}
                onClick={() => router.push(`/admin/manufacturers/${manufacturer.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
