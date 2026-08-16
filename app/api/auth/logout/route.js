import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { status: 'success', message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear authentication cookies
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to logout' },
      { status: 500 }
    );
  }
}
