import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function POST(request) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');

    const response = await fetch(`${BACKEND_URL}/api/customer/request-reseller-upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Request reseller upgrade proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to submit upgrade request' },
      { status: 500 }
    );
  }
}
