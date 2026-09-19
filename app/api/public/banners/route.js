import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const VALID_EVENTS = new Set(['view', 'click']);

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/public/banners`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Public Banners Proxy] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to banner service',
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { bannerId, event } = await request.json();

    if (!bannerId || !VALID_EVENTS.has(event)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid banner event',
      }, { status: 400 });
    }

    const response = await fetch(
      `${BACKEND_URL}/api/public/banners/${encodeURIComponent(bannerId)}/${event}`,
      { method: 'POST' }
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Public Banner Tracking Proxy] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to track banner event',
    }, { status: 500 });
  }
}