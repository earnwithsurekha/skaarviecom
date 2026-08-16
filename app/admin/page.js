'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // If authenticated as admin, redirect to dashboard
    if (isAuthenticated && user && user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    // For any other case (not authenticated or authenticated as non-admin),
    // redirect to admin login page
    router.push('/login/admin');
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
