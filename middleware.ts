import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setAccessToken } from './services/axiosInstance';
;

const BACKEND_URL = process.env.BACKEND_URL || '';
const BACKEND_TIMEOUT = 5000;

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/health',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/public',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
}

// Refresh the access token using the refresh token (in cookie)
async function refreshAccessToken(request: NextRequest): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    setAccessToken(data?.data?.accessToken || '');
    return data?.data?.accessToken || null;
  } catch (err) {
    return null;
  }
}

// Use new access token to verify user
async function verifyUser(accessToken: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    if (response.ok && data.status === 'success') {
      return { success: true, user: data.data };
    }

    return {
      success: false,
      message: data.message || 'Authentication failed',
      code: data.code || 'AUTH_FAILED',
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Timeout', code: 'AUTH_TIMEOUT' };
    }

    return { success: false, message: 'Error verifying auth', code: 'AUTH_ERROR' };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Only have refreshToken cookie – no access token
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // 🟢 PUBLIC ROUTES
  if (isPublicRoute(pathname)) {
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(request);
      if (newAccessToken) {
        const authResult = await verifyUser(newAccessToken);
        if (authResult.success) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
    return response;
  }

  // 🔒 PROTECTED ROUTES
  if (!refreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const accessToken = await refreshAccessToken(request);
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('error', 'token_refresh_failed');
    return NextResponse.redirect(loginUrl);
  }

  const authResult = await verifyUser(accessToken);
  if (!authResult.success || !authResult.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('error', authResult.code || 'auth_failed');
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
