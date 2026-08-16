import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    const response = await fetch(`${BACKEND_URL}/api/admin/reseller-upgrade-requests?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': token || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get upgrade requests proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch upgrade requests' },
      { status: 500 }
    );
  }
}
