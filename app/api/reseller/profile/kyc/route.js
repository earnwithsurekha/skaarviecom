import { cookies } from 'next/headers';

export async function PUT(request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/profile/kyc`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Update KYC API error:', error);
    return Response.json({ error: 'Failed to update KYC details' }, { status: 500 });
  }
}
