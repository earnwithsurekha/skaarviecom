import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const response = await fetch('http://localhost:5000/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
