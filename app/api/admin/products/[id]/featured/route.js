import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/getAuthToken';

export async function PATCH(request, context) {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      console.error('[Featured] No token in cookies');
      return NextResponse.json(
        { status: 'error', message: 'Access denied. No token provided' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    console.log('[Featured] Making request for product:', id, 'with featured:', body.isFeatured);

    const response = await fetch(`http://localhost:5000/api/admin/products/${id}/featured`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('[Featured] Backend response:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Featured] Proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
