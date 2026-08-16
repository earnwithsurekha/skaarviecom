export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="animate-pulse">
            <div className="flex gap-4 p-4 border-b">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="flex gap-4 p-4 border-b">
                {[1, 2, 3, 4, 5].map((col) => (
                  <div key={col} className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
