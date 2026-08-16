import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('[Referral Track Click Proxy] Tracking click:', body);
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/referrals/track-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    
    console.log('[Referral Track Click Proxy] Response:', backendResponse.status);

    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('[Referral Track Click Proxy] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to track referral click',
      code: 'PROXY_ERROR',
      details: error.message
    }, { 
      status: 500 
    });
  }
}
