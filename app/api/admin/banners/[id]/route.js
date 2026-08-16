import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
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

    const response = await fetch(`http://localhost:5000/api/admin/banners/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get banner API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch banner', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
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

    const formData = await request.formData();

    const response = await fetch(`http://localhost:5000/api/admin/banners/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Update banner API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update banner', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
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

    const response = await fetch(`http://localhost:5000/api/admin/banners/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete banner API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete banner', error: error.message },
      { status: 500 }
    );
  }
}
