import { fetchBackend } from '@/lib/serverBackendUrl';
export async function GET(request, { params }) {
  try {
    const { username } = params;
    const response = await fetchBackend(
      `/api/store/${username}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Store API error:', error);
    return Response.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}
