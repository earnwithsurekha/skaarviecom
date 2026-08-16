export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Filters Skeleton */}
      <div className="card p-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="animate-pulse">
            {/* Table Header */}
            <div className="flex gap-4 p-4 border-b">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            {/* Table Rows */}
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex gap-4 p-4 border-b">
                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
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
