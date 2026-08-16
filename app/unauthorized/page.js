'use client';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useEffect } from 'react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // If user is logged in, redirect to their appropriate dashboard
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'manufacturer') {
        router.push('/manufacturer/dashboard');
      } else if (user.role === 'reseller') {
        router.push('/reseller/dashboard');
      }
    }
  }, [user, router]);

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-red-600 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      <div className="relative w-full max-w-md">
        {/* Unauthorized Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="inline-flex p-4 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl">
              <ShieldX className="w-12 h-12 text-white" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
              <p className="text-gray-600 mt-2">
                You don't have permission to access this page
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 text-center">
              This page is restricted to specific user roles. Please ensure you're logged in with the correct account type.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-800 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>

            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need help? Contact support or try logging in with a different account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
