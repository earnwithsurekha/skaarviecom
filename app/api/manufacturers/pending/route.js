import { NextResponse } from 'next/server';
import { buildBackendApiUrl } from '@/lib/serverBackendUrl';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Forward the request to the backend
    const backendResponse = await fetch(buildBackendApiUrl('manufacturers', 'pending'), {
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { 
      status: backendResponse.status,
    });
  } catch (error) {
    console.error('Manufacturers pending proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch manufacturers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { manufacturerId, action } = await request.json();
    
    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Determine the backend endpoint based on action
    const endpoint = action === 'approve' 
      ? buildBackendApiUrl('manufacturers', manufacturerId, 'approve')
      : buildBackendApiUrl('manufacturers', manufacturerId, 'reject');

    const backendResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { 
      status: backendResponse.status,
    });
  } catch (error) {
    console.error('Manufacturer action proxy error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process action' },
      { status: 500 }
    );
  }
}
