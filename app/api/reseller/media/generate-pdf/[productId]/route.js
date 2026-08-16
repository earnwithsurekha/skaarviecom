import { cookies } from 'next/headers';

export async function POST(request, { params }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = params;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reseller/media/generate-pdf/${productId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      return new Response(blob, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'text/html',
          'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment; filename="product-catalog.html"',
        },
      });
    }

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Generate PDF API error:', error);
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
