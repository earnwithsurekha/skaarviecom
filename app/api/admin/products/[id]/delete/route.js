import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/getAuthToken';

export async function DELETE(request, context) {
  try {
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const response = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete product proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
