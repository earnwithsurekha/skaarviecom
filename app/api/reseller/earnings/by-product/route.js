import { fetchBackend } from '@/lib/serverBackendUrl';
import { getAuthToken } from '@/lib/getAuthToken';

export async function GET(request) {
    const token = getAuthToken(request);

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetchBackend(
      `/api/reseller/earnings/by-product`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Earnings by product API error:', error);
    return Response.json({ error: 'Failed to fetch earnings by product' }, { status: 500 });
  }
}
