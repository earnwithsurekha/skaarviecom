import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { productId } = params;
    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/inventory/${productId}/decrease`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Decrease stock error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to decrease stock' },
      { status: 500 }
    );
  }
}
