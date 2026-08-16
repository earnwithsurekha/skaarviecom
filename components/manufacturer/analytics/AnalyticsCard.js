'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

export default function AnalyticsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  subtitle,
  valuePrefix = '',
  valueSuffix = '',
  colorClass = 'text-blue-600 dark:text-blue-400'
}) {
  const hasTrend = trend !== undefined && trendValue !== undefined;
  const isPositiveTrend = trend === 'up';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        {Icon && (
          <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {valuePrefix}{typeof value === 'number' ? value.toLocaleString() : value}{valueSuffix}
          </p>
          
          {hasTrend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isPositiveTrend 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trendValue}%</span>
            </div>
          )}
        </div>
        
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
