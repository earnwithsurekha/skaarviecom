'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function TestCustomerAccessPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const [accessData, setAccessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      const storedToken = localStorage.getItem('token');
      console.log('Stored token:', storedToken ? 'EXISTS' : 'MISSING');
      console.log('Redux token:', token ? 'EXISTS' : 'MISSING');
      console.log('User:', user);

      if (!storedToken && !token) {
        setError('No token found - please log in');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/customer/check-access', {
        headers: {
          'Authorization': `Bearer ${storedToken || token}`,
        },
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        setAccessData(data);
      } else {
        const errorText = await response.text();
        setError(`API error: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const goToCustomerDashboard = () => {
    console.log('[Test Page] Manually navigating to /customer');
    router.push('/customer');
  };

  const goToResellerDashboard = () => {
    console.log('[Test Page] Manually navigating to /reseller/dashboard');
    router.push('/reseller/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Customer Access Test Page</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
            <p><strong>Name:</strong> {user?.full_name || 'N/A'}</p>
            <p><strong>Token in Redux:</strong> {token ? 'EXISTS' : 'MISSING'}</p>
            <p><strong>Token in localStorage:</strong> {typeof window !== 'undefined' && localStorage.getItem('token') ? 'EXISTS' : 'MISSING'}</p>
          </div>
        </div>

        {/* Access Check Results */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Access Check Results</h2>
          
          {loading && (
            <p className="text-gray-600">Loading...</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {accessData && (
            <div className="space-y-2">
              <p><strong>Status:</strong> {accessData.status}</p>
              <p><strong>Has Customer Access:</strong> 
                <span className={accessData.hasAccess ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {' '}{accessData.hasAccess ? 'YES ✓' : 'NO ✗'}
                </span>
              </p>
              <p><strong>Reason:</strong> {accessData.reason}</p>
            </div>
          )}

          <button
            onClick={checkAccess}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Recheck Access
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Navigation</h2>
          <div className="flex gap-4">
            <button
              onClick={goToCustomerDashboard}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              Go to Customer Dashboard
            </button>
            <button
              onClick={goToResellerDashboard}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
            >
              Go to Reseller Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold"
            >
              Go to Homepage
            </button>
          </div>
        </div>

        {/* Console Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-2 text-yellow-800">Debug Instructions</h2>
          <p className="text-yellow-700">
            1. Open browser console (F12)<br />
            2. Check the console logs above<br />
            3. Click "Recheck Access" to see API call details<br />
            4. Try the manual navigation buttons<br />
            5. Check console logs for redirect behavior
          </p>
        </div>
      </div>
    </div>
  );
}
