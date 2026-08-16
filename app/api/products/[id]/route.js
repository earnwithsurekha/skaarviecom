import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
export async function GET(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/products/${params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to fetch product',
      },
      { status: 500 }
    );
  }
}

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Manufacturer)
export async function PUT(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the FormData from the request
    const formData = await request.formData();

    // Forward the FormData to the backend
    const response = await fetch(`${BACKEND_URL}/api/products/${params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to update product',
      },
      { status: 500 }
    );
  }
}

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Manufacturer)
export async function DELETE(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/products/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to delete product',
      },
      { status: 500 }
    );
  }
}
