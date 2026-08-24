import { getAuthToken } from '@/lib/getAuthToken';

export async function GET() {
    const token = { value: getAuthToken(request) };

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/referrals/my-code`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Referral code API error:', error);
    return Response.json({ error: 'Failed to fetch referral code' }, { status: 500 });
  }
}
