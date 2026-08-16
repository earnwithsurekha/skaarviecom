import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request) {
  try {
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

    const response = await fetch(`${API_URL}/api/customer/profile`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error fetching profile:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch profile',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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

    const response = await fetch(`${API_URL}/api/customer/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] Error updating profile:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to update profile',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
