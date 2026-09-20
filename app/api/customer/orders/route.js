import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


export async function POST(request) {
  try {
    const body = await request.json();
    
    // Get authorization header from request
    const authorization = request.headers.get('authorization');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetchBackend(`/api/customer/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error creating order:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create order',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
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

    const response = await fetchBackend(`/api/customer/orders`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error fetching orders:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch orders',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
