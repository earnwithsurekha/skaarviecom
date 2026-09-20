import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


// GET - Get analytics for a specific product
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    
    // Build query string from search params
    const queryString = searchParams.toString();
    const url = `/api/manufacturers/products/${id}/analytics${queryString ? `?${queryString}` : ''}`;

    const response = await fetchBackend(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch product analytics' },
      { status: 500 }
    );
  }
}
