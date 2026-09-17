import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getGoogleAuthUrl, getRedirectUri } from '@/lib/email/gmail';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Ensure only authenticated administrator can trigger Google OAuth authorization
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    const loginUrl = new URL('/login?callbackUrl=/admin/settings', req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const origin = req.nextUrl.origin;
    const stateToken = `admin_${session.userId}_${Date.now()}`;
    const authUrl = await getGoogleAuthUrl(origin, stateToken);

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error('Google OAuth init error:', err);
    const errorUrl = new URL(`/admin/settings?gmail_error=${encodeURIComponent(err.message)}`, req.url);
    return NextResponse.redirect(errorUrl);
  }
}
