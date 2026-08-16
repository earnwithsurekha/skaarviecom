import { cookies } from 'next/headers';

export async function GET(request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const status = searchParams.get('status');

    const queryParams = new URLSearchParams({ page, limit });
    if (status) queryParams.append('status', status);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/withdrawals?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Withdrawals API error:', error);
    return Response.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}
