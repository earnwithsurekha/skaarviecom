import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// GET - Check if product is saved by current user
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');

    const response = await fetch(`${BACKEND_URL}/api/analytics/products/${id}/save/status`, {
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
      { status: 'error', message: 'Failed to check save status' },
      { status: 500 }
    );
  }
}
