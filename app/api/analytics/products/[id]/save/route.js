import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


// POST - Save product to wishlist
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');
    const body = await request.json();

    const response = await fetchBackend(`/api/analytics/products/${id}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to save product' },
      { status: 500 }
    );
  }
}

// DELETE - Remove product from wishlist
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');

    const response = await fetchBackend(`/api/analytics/products/${id}/save`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to remove product from wishlist' },
      { status: 500 }
    );
  }
}
