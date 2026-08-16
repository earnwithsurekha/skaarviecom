import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// GET - Get analytics for a specific product
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    
    // Build query string from search params
    const queryString = searchParams.toString();
    const url = `${BACKEND_URL}/api/manufacturers/products/${id}/analytics${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
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
