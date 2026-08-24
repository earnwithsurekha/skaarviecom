import { getAuthToken } from '@/lib/getAuthToken';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const token = { value: getAuthToken(request) };

    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reseller/profile/photo`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`
        },
        body: formData
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Profile photo upload proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
