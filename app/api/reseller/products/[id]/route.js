import { getAuthToken } from '@/lib/getAuthToken';

export async function GET(request, { params }) {
    const token = { value: getAuthToken(request) };

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/products/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Product details API error:', error);
    return Response.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}
