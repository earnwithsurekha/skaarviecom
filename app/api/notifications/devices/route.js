import { fetchBackend } from '@/lib/serverBackendUrl';
import { getAuthToken } from '@/lib/getAuthToken';
import { NextResponse } from 'next/server';

const proxyDeviceRequest = async (request, method) => {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { status: 'error', message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const response = await fetchBackend('/api/notifications/devices', {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Notification device ${method} proxy error:`, error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to update notification device' },
      { status: 500 }
    );
  }
};

export const POST = (request) => proxyDeviceRequest(request, 'POST');
export const DELETE = (request) => proxyDeviceRequest(request, 'DELETE');