import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');
    const { id } = params;

    const response = await fetchBackend(`/api/admin/reseller-upgrade-requests/${id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Reject upgrade request proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to reject upgrade request' },
      { status: 500 }
    );
  }
}
