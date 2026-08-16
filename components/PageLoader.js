'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary-600 animate-pulse" style={{ width: '100%' }} />
      <div className="absolute top-4 right-4 bg-white rounded-full shadow-lg p-3">
        <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
      </div>
    </div>
  );
}
