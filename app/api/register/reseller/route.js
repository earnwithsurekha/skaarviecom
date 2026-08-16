export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    
    console.log('[Reseller Registration API] Forwarding to backend:', `${BACKEND_URL}/api/auth/register/reseller`);
    
    const response = await fetch(
      `${BACKEND_URL}/api/auth/register/reseller`,
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
