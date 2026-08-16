import { NextResponse } from 'next/server';

// @route   POST /api/auth/verify-otp
// @desc    Proxy to backend verify-otp endpoint
// @access  Public
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Verify OTP proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
