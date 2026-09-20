import { fetchBackend } from '@/lib/serverBackendUrl';
import { NextResponse } from 'next/server';


export async function GET(request, { params }) {
  try {
    const { code } = params;
    
    console.log('[Referral Validate Proxy] Validating code:', code);
    
    const backendResponse = await fetchBackend(`/api/referrals/validate/${code}`, {
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
