import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// GET - Get analytics overview for all manufacturer's products
export async function GET(request) {
  try {
    const token = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    
    // Build query string from search params (startDate, endDate, sortBy, limit)
    const queryString = searchParams.toString();
    const url = `${BACKEND_URL}/api/manufacturers/analytics/overview${queryString ? `?${queryString}` : ''}`;

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
      { status: 'error', message: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}
