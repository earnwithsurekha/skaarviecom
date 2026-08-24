import { getAuthToken } from '@/lib/getAuthToken';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/read-all`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
