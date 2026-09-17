import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode, getRedirectUri } from '@/lib/email/gmail';

export const dynamic = 'force-dynamic';

/**
 * EXACT Production OAuth 2.0 Callback / Redirect URI:
 * https://pragathi-ai-education.vercel.app/api/auth/google/callback
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth callback error returned by Google:', error);
    const dest = new URL(`/admin/settings?gmail_error=${encodeURIComponent(error)}`, req.url);
    return NextResponse.redirect(dest);
  }

  if (!code) {
    const dest = new URL('/admin/settings?gmail_error=No+authorization+code+received', req.url);
    return NextResponse.redirect(dest);
  }

  try {
    const origin = req.nextUrl.origin;
    const redirectUri = getRedirectUri(origin);

    const result = await exchangeGoogleCode(code, redirectUri);

    console.log(`[Gmail OAuth Success]: Authorized for ${result.authorizedEmail}. Refresh token saved.`);

    const successDest = new URL(
      `/admin/settings?gmail=connected&account=${encodeURIComponent(result.authorizedEmail)}`,
      req.url
    );
    return NextResponse.redirect(successDest);
  } catch (err: any) {
    console.error('Failed to exchange Google OAuth code:', err);
    const failDest = new URL(`/admin/settings?gmail_error=${encodeURIComponent(err.message)}`, req.url);
    return NextResponse.redirect(failDest);
  }
}
