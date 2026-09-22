import { fetchBackend } from '@/lib/serverBackendUrl';
import { getAuthToken } from '@/lib/getAuthToken';
import { NextResponse } from 'next/server';

export async function DELETE(request, context) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const response = await fetchBackend(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
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