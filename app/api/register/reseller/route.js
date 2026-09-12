import { buildBackendApiUrl } from '@/lib/serverBackendUrl';

const RESELLER_REGISTRATION_URL = buildBackendApiUrl('auth', 'register', 'reseller');

export async function POST(request) {
  try {
    const formData = await request.formData();

    console.log('[Reseller Registration API] Forwarding to backend:', RESELLER_REGISTRATION_URL);
    
    const response = await fetch(
      RESELLER_REGISTRATION_URL,
      {
        method: 'POST',
        body: formData,
      }
    );

    console.log('[Reseller Registration API] Backend response status:', response.status);
    
    const data = await response.json();
    console.log('[Reseller Registration API] Backend response data:', data);
    
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Reseller registration API error:', error);
    return Response.json({ 
      status: 'error',
      message: 'Failed to register reseller',
      details: error.message 
    }, { status: 500 });
  }
}
