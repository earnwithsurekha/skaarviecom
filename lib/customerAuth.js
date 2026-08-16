'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

/**
 * Customer route protection hook
 * Redirects non-customer users to unauthorized page
 * Usage: Call at the top of customer-only page components
 */
export function useCustomerAuth() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated
    if (!token || !user) {
      router.push('/unauthorized/customer');
      return;
    }

    // Check if user has customer role
    if (user.role !== 'customer') {
      router.push('/unauthorized/customer');
      return;
    }
  }, [user, token, router]);

  return { user, isCustomer: user?.role === 'customer' };
}
