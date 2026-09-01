import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// @route   PATCH /api/orders/[id]/status
// @desc    Update order status
// @access  Private (Manufacturer)
export async function PATCH(request, { params }) {
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

    const response = await fetch(`${BACKEND_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
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
    console.error('Update order status API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
