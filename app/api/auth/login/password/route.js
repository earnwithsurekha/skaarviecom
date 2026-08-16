import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('[Password Login Proxy] Forwarding request to backend:', BACKEND_URL);
    
    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    
    console.log('[Password Login Proxy] Backend response status:', backendResponse.status);
    console.log('[Password Login Proxy] Backend response:', { status: data.status, code: data.code });

    // If login successful, set cookies
    if (backendResponse.ok && data.data?.token) {
      const response = NextResponse.json(data, { 
        status: backendResponse.status,
      });

      // Set HTTP-only cookies for authentication
      response.cookies.set('token', data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      if (data.data.refreshToken) {
        response.cookies.set('refreshToken', data.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });
      }

      return response;
    }

    // Return the response from backend without cookies if not successful
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('[Password Login Proxy] Error:', error);
    
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
