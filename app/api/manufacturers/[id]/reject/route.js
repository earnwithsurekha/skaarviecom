import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = params;
    const body = await request.json();
    
    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Forward the reject request to the backend
    const backendResponse = await fetch(
      `http://localhost:5000/api/manufacturers/${id}/reject`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await backendResponse.json();

    return NextResponse.json(data, { 
      status: backendResponse.status,
    });
  } catch (error) {
    console.error('Reject manufacturer proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to reject manufacturer' },
      { status: 500 }
    );
  }
}
