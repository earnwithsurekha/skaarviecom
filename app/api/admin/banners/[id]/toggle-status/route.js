import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request, context) {
  try {
    const { params } = context;
    const id = params.id;
    
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`http://localhost:5000/api/admin/banners/${id}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Toggle banner status API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to toggle banner status', error: error.message },
      { status: 500 }
    );
  }
}
