import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


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

    const response = await fetchBackend(`/api/customer/orders/${id}`, {
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
