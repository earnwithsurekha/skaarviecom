import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get authorization header from request
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/api/customer/orders/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error fetching order details:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch order details',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
