import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = params;
    
    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Forward the approve request to the backend
    const backendResponse = await fetch(
      `http://localhost:5000/api/manufacturers/${id}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await backendResponse.json();

    return NextResponse.json(data, { 
      status: backendResponse.status,
    });
  } catch (error) {
    console.error('Approve manufacturer proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to approve manufacturer' },
      { status: 500 }
    );
  }
}
