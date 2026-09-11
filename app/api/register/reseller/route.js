const backendUrl = new URL(
  process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL
  || 'http://localhost:5000'
);
const backendPath = backendUrl.pathname.split('/').filter(Boolean);

if (backendPath.at(-1) !== 'api') {
  backendPath.push('api');
}

backendUrl.pathname = [...backendPath, 'auth', 'register', 'reseller'].join('/');
backendUrl.search = '';
backendUrl.hash = '';

const RESELLER_REGISTRATION_URL = backendUrl.toString();

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
