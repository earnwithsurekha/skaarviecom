import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/serverBackendUrl';

// @route   POST /api/auth/register
// @desc    Proxy to backend register endpoint with file upload support
// @access  Public
export async function POST(request) {
  try {
    const formData = await request.formData();
    const token = request.headers.get('authorization');

    // Forward request to backend (FormData is automatically handled correctly)
    const response = await fetchBackend('/api/auth/register', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - browser sets it automatically with boundary
        ...(token && { 'Authorization': token }),
      },
      body: formData,
    });

    const data = await response.json();
    
    // Log for debugging
    console.log('Register response:', response.status, data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Register proxy error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Failed to register',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
