import { NextResponse } from 'next/server';

// @route   GET /api/manufacturers/dashboard
// @desc    Get manufacturer dashboard summary (proxy to backend)
// @access  Private (Manufacturer)
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Forward the request to the backend
    const backendResponse = await fetch('http://localhost:5000/api/manufacturers/dashboard', {
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { 
      status: backendResponse.status,
    });
  } catch (error) {
    console.error('Manufacturer dashboard proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

