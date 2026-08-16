import { cookies } from 'next/headers';

export async function POST(request, { params }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const productId = params.id;
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/products/${productId}/save`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Save product API error:', error);
    return Response.json({ error: 'Failed to save product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const productId = params.id;
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/products/${productId}/save`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Unsave product API error:', error);
    return Response.json({ error: 'Failed to unsave product' }, { status: 500 });
  }
}
