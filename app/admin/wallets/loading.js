export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="animate-pulse">
          <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-5 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex gap-3 animate-pulse">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 animate-pulse">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="space-y-6">
        {/* Reseller Wallet */}
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Manufacturer Wallet */}
        <div className="space-y-4">
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="p-6 space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
