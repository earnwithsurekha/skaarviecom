import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


// POST - Track product click
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');
    const body = await request.json();

    const response = await fetchBackend(`/api/analytics/products/${id}/click`, {
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
      { status: 'error', message: 'Failed to track click' },
      { status: 500 }
    );
  }
}
