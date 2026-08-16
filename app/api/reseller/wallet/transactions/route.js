import { cookies } from 'next/headers';

export async function GET(request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/wallet/transactions${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Wallet transactions API error:', error);
    return Response.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
