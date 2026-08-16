import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    
    console.log('[Public Product Detail Proxy] Fetching product:', slug);
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/public/products/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();
    
    console.log('[Public Product Detail Proxy] Backend response status:', backendResponse.status);

    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('[Public Product Detail Proxy] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to backend server',
      code: 'PROXY_ERROR',
      details: error.message
    }, { 
      status: 500 
    });
  }
}
