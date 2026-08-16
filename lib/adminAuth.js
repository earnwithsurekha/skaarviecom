'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

/**
 * Admin route protection hook
 * Redirects non-admin users to login page
 * Usage: Call at the top of admin page components
 */
export function useAdminAuth() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated
    if (!token || !user) {
      router.push('/unauthorized/admin');
      return;
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      router.push('/unauthorized/admin');
      return;
    }
  }, [user, token, router]);

  return { user, isAdmin: user?.role === 'admin' };
}
