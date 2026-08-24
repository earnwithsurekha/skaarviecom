import { getAuthToken } from '@/lib/getAuthToken';

export async function GET() {
    const token = { value: getAuthToken(request) };

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/media/marketing-creatives`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Marketing creatives API error:', error);
    return Response.json({ error: 'Failed to fetch marketing creatives' }, { status: 500 });
  }
}
