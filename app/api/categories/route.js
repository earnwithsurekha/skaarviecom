import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/serverBackendUrl';

export async function GET() {
  try {
    const response = await fetchBackend('/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Categories proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
