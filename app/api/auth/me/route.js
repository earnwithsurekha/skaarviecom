import { NextResponse } from 'next/server';

// @route   GET /api/auth/me
// @desc    Proxy to backend me endpoint
// @access  Private
export async function GET(request) {
  try {
    const token = request.headers.get('authorization');

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': token || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Me proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
