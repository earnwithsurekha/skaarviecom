import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend
    const backendResponse = await fetchBackend(`/api/auth/register/manufacturer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    
    console.log('[Manufacturer Registration Proxy] Backend response status:', backendResponse.status);
    console.log('[Manufacturer Registration Proxy] Backend response:', { status: data.status });

    // Return the response from backend
    // Note: Manufacturers need admin approval, so we don't auto-login
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('[Manufacturer Registration Proxy] Error:', error);
    
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
