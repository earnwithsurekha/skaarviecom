import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization');
    const { id } = params;

    const response = await fetch(`${BACKEND_URL}/api/admin/reseller-upgrade-requests/${id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Approve upgrade request proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to approve upgrade request' },
      { status: 500 }
    );
  }
}
