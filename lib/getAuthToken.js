import { cookies } from 'next/headers';

/**
 * Extracts the auth token from the request.
 * Checks the Authorization header first, then falls back to the cookie.
 * This supports both cookie-based auth (set at login) and header-based auth
 * (sent explicitly by Redux slices / fetch calls).
 */
export function getAuthToken(request) {
  // 1. Try Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Fall back to HTTP-only cookie set at login
  const cookieStore = cookies();
  return cookieStore.get('token')?.value || null;
}
