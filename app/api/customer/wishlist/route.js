import { fetchBackend } from '@/lib/serverBackendUrl';
import { getAuthToken } from '@/lib/getAuthToken';

export async function GET(request) {
  const token = getAuthToken(request);
  if (!token) {
    return Response.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const response = await fetchBackend('/api/analytics/wishlist', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Customer wishlist API error:', error);
    return Response.json(
      { status: 'error', message: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}