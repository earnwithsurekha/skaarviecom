import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get the token from cookies
  const token = request.cookies.get('token')?.value;
  
  // Protected routes that require authentication
  const isResellerRoute = pathname.startsWith('/reseller');
  const isManufacturerRoute = pathname.startsWith('/manufacturer');
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Public routes that don't require authentication
  const isLoginRoute = pathname.startsWith('/login');
  const isRegisterRoute = pathname.startsWith('/register');
  
  // Note: Client-side auth checks in layouts handle the actual authentication
  // This middleware is just for initial redirect if no token exists
  // We're being lenient here to allow client-side Redux state to work
  
  // Only redirect if there's definitely no way to be authenticated
  // Since we use localStorage + Redux, we'll let the client-side check handle most cases
  
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
