import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request, { params }) {
  try {
    const { code } = params;
    
    console.log('[Referral Validate Proxy] Validating code:', code);
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/referrals/validate/${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();
    
    console.log('[Referral Validate Proxy] Response:', backendResponse.status);

    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('[Referral Validate Proxy] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to validate referral code',
      code: 'PROXY_ERROR',
      details: error.message
    }, { 
      status: 500 
    });
  }
}
