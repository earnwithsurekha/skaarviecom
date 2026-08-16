'use client';

import { useState } from 'react';
import { Search, Calendar, RefreshCw } from 'lucide-react';
import { ORDER_STATUS } from '@/lib/orderUtils';

export default function OrderFilters({ filters, onFilterChange, onRefresh }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const statusTabs = [
    { value: 'all', label: 'All Orders', count: null },
    { value: ORDER_STATUS.NEW, label: 'New', count: null },
    { value: ORDER_STATUS.ACCEPTED, label: 'Accepted', count: null },
    { value: ORDER_STATUS.PROCESSING, label: 'Processing', count: null },
    { value: ORDER_STATUS.SHIPPED, label: 'Shipped', count: null },
    { value: ORDER_STATUS.DELIVERED, label: 'Delivered', count: null }
  ];

  const handleSearchChange = (value) => {
    setLocalSearch(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ search: localSearch });
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onFilterChange({ search: '' });
  };

  const handleDateChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleClearDates = () => {
    onFilterChange({ startDate: null, endDate: null });
  };

  return (
    <div className="card space-y-4">
      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onFilterChange({ status: tab.value })}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filters.status === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Date Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by order number, product..."
              className="input pl-10 pr-10 w-full"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </form>

        {/* Start Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="input pl-10 w-full"
            placeholder="Start date"
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="input pl-10 w-full"
            placeholder="End date"
          />
        </div>
      </div>

      {/* Active Filters and Actions */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
        <div className="flex items-center gap-2 flex-wrap">
          {filters.status !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
              Status: {filters.status}
              <button
                onClick={() => onFilterChange({ status: 'all' })}
                className="ml-2 hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Search: {filters.search}
              <button
                onClick={handleClearSearch}
                className="ml-2 hover:text-blue-900"
              >
                ×
              </button>
            </span>
          )}
          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Date range
              {' '}
              <button
                onClick={handleClearDates}
                className="ml-2 hover:text-purple-900"
              >
                ×
              </button>
            </span>
          )}
        </div>

        <button
          onClick={onRefresh}
          className="btn btn-ghost btn-sm"
          title="Refresh orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
