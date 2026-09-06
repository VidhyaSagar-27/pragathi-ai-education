import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'pragathi_ai_auth_token';

function decodeJwtPayload(token: string): { userId: string; role: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const isExpired = payload?.exp ? Date.now() >= payload.exp * 1000 : true;
  const validSession = payload && !isExpired;

  // Protect Admin routes
  if (pathname.startsWith('/admin')) {
    if (!validSession || payload?.role !== 'ADMIN') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Instructor routes
  if (pathname.startsWith('/instructor')) {
    if (!validSession || payload?.role !== 'INSTRUCTOR') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('error', 'unauthorized_instructor');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Student routes
  if (pathname.startsWith('/student')) {
    if (!validSession || payload?.role !== 'STUDENT') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('error', 'unauthorized_student');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/instructor/:path*', '/student/:path*'],
};
