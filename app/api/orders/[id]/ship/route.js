import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// @route   POST /api/orders/[id]/ship
// @desc    Mark order as shipped with tracking
// @access  Private (Manufacturer)
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const cookieToken = request.cookies.get('token')?.value;
    const authorization = request.headers.get('authorization') ||
      (cookieToken ? `Bearer ${cookieToken}` : null);
    
    if (!authorization) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/orders/${id}/ship`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Ship order API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
