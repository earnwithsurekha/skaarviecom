import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


export async function GET(request) {
  try {
    const token = request.headers.get('authorization');

    const response = await fetchBackend(`/api/customer/reseller-upgrade-status`, {
      method: 'GET',
      headers: {
        'Authorization': token || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Check upgrade status proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to check upgrade status' },
      { status: 500 }
    );
  }
}
