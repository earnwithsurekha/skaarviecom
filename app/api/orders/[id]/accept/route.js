import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


// @route   POST /api/orders/[id]/accept
// @desc    Accept order
// @access  Private (Manufacturer)
export async function POST(request, { params }) {
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

    const response = await fetchBackend(`/api/orders/${id}/accept`, {
      method: 'POST',
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
    console.error('Accept order API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
