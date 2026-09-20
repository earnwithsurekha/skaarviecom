import { fetchBackend } from '@/lib/serverBackendUrl';
export async function GET(request, { params }) {
  try {
    const { referralCode } = params;
    const response = await fetchBackend(
      `/api/track/click-stats/${referralCode}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Click stats API error:', error);
    return Response.json({ error: 'Failed to fetch click statistics' }, { status: 500 });
  }
}
