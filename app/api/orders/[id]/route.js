import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// @route   GET /api/orders/[id]
// @desc    Get single order details
// @access  Private (Manufacturer)
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const cookieToken = request.cookies.get('token')?.value;
    const authorization = request.headers.get('authorization') ||
      (cookieToken ? `Bearer ${cookieToken}` : null);
    
    if (!authorization) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Order details API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
