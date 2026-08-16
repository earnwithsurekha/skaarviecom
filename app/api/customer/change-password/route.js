import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request) {
  try {
    const body = await request.json();
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

    const response = await fetch(`${API_URL}/api/customer/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error changing password:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to change password',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
