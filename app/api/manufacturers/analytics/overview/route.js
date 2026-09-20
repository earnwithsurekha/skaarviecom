import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


// GET - Get analytics overview for all manufacturer's products
export async function GET(request) {
  try {
    const token = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    
    // Build query string from search params (startDate, endDate, sortBy, limit)
    const queryString = searchParams.toString();
    const url = `/api/manufacturers/analytics/overview${queryString ? `?${queryString}` : ''}`;

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
      { status: 'error', message: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}
