import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


export async function GET(request, { params }) {
  try {
    const { slug } = params;
    
    console.log('[Public Product Detail Proxy] Fetching product:', slug);
    
    const backendResponse = await fetchBackend(`/api/public/products/${slug}`, {
      method: 'GET',
      cache: 'no-store',
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
