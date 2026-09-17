/**
 * PRAGATHI AI — Google OAuth 2.0 & Gmail API Automation Engine
 * Authorized Email: hello.pragathiai@gmail.com
 * Official Production Redirect URI: https://pragathi-ai-education.vercel.app/api/auth/google/callback
 */

import { getDb, updateDb } from '@/lib/db';
import { GmailConfig } from '@/lib/db/types';

export const GMAIL_TARGET_ACCOUNT = 'hello.pragathiai@gmail.com';
export const PRODUCTION_GOOGLE_REDIRECT_URI =
  'https://pragathi-ai-education.vercel.app/api/auth/google/callback';

export interface SendGmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendGmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

/**
 * Resolves the appropriate Redirect URI based on environment and request origin.
 */
export function getRedirectUri(origin?: string): string {
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return `${origin}/api/auth/google/callback`;
  }
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  return PRODUCTION_GOOGLE_REDIRECT_URI;
}

/**
 * Resolves Google OAuth credentials from database settings or environment variables.
 */
export async function getGoogleCredentials() {
  const db = await getDb().catch(() => null);
  const gmailCfg = db?.settings?.gmailConfig || {};

  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    gmailCfg.clientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET || gmailCfg.clientSecret;

  const refreshToken =
    process.env.GMAIL_REFRESH_TOKEN || gmailCfg.refreshToken;

  const senderEmail =
    process.env.GMAIL_SENDER_EMAIL ||
    gmailCfg.authorizedEmail ||
    GMAIL_TARGET_ACCOUNT;

  return {
    clientId,
    clientSecret,
    refreshToken,
    senderEmail,
    accessToken: gmailCfg.accessToken,
    tokenExpiry: gmailCfg.tokenExpiry,
  };
}

/**
 * Generates the Google OAuth 2.0 authorization URL for connecting hello.pragathiai@gmail.com.
 */
export async function getGoogleAuthUrl(origin?: string, stateToken?: string): Promise<string> {
  const { clientId } = await getGoogleCredentials();
  if (!clientId) {
    throw new Error(
      'GOOGLE_CLIENT_ID is not configured. Please set GOOGLE_CLIENT_ID in your environment or Admin Settings.'
    );
  }

  const redirectUri = getRedirectUri(origin);
  const scope = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline', // Required by Google to issue a refresh_token
    prompt: 'consent', // Forces consent screen to guarantee refresh_token is returned
    login_hint: GMAIL_TARGET_ACCOUNT, // Pre-selects official Pragathi AI Gmail
    state: stateToken || 'pragathi_gmail_oauth_' + Date.now(),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges the one-time authorization code for an access token and refresh token.
 */
export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = await getGoogleCredentials();

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured to exchange code.');
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code with Google');
  }

  // Verify the authorized account email
  let userEmail = GMAIL_TARGET_ACCOUNT;
  if (data.access_token) {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        if (userInfo.email) userEmail = userInfo.email;
      }
    } catch (e) {
      console.warn('Could not fetch userinfo from Google:', e);
    }
  }

  const expiryTimestamp = Date.now() + (data.expires_in || 3600) * 1000;

  // Persist tokens securely in database settings
  await updateDb((dbState) => {
    if (!dbState.settings) {
      dbState.settings = {} as any;
    }
    const existing = dbState.settings.gmailConfig || {};
    dbState.settings.gmailConfig = {
      ...existing,
      clientId: clientId || existing.clientId,
      clientSecret: clientSecret || existing.clientSecret,
      refreshToken: data.refresh_token || existing.refreshToken, // Google may only return refresh_token on prompt=consent
      accessToken: data.access_token,
      tokenExpiry: expiryTimestamp,
      authorizedEmail: userEmail,
      connectedAt: new Date().toISOString(),
    };

    if (!dbState.settings.emailConfig) {
      dbState.settings.emailConfig = {};
    }
    dbState.settings.emailConfig.provider = 'GMAIL_API';
    dbState.settings.emailConfig.fromEmail = userEmail;
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    authorizedEmail: userEmail,
  };
}

/**
 * Returns a valid, non-expired Google OAuth 2.0 access token, automatically refreshing if needed.
 */
export async function getValidAccessToken(): Promise<string> {
  const creds = await getGoogleCredentials();

  if (!creds.refreshToken) {
    throw new Error(
      `No Gmail refresh token found for ${GMAIL_TARGET_ACCOUNT}. Please connect Google OAuth in Admin Settings.`
    );
  }

  // If existing access token is valid for at least 2 more minutes, return it
  if (creds.accessToken && creds.tokenExpiry && creds.tokenExpiry > Date.now() + 120 * 1000) {
    return creds.accessToken;
  }

  if (!creds.clientId || !creds.clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required to refresh access token.');
  }

  // Request a fresh access token using the refresh token
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: creds.refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Failed to refresh Google access token');
  }

  const newAccessToken = data.access_token;
  const newExpiry = Date.now() + (data.expires_in || 3600) * 1000;

  // Update token in DB
  await updateDb((dbState) => {
    if (dbState.settings?.gmailConfig) {
      dbState.settings.gmailConfig.accessToken = newAccessToken;
      dbState.settings.gmailConfig.tokenExpiry = newExpiry;
    }
  }).catch(() => {});

  return newAccessToken;
}

/**
 * Constructs an RFC 2822 compliant MIME message string.
 */
function buildMimeMessage({
  to,
  from,
  subject,
  html,
  text,
}: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}): string {
  const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const plainText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const boundary = `====PRAGATHI_BOUNDARY_${Date.now()}====`;

  const parts = [
    `From: PRAGATHI AI <${from}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    plainText,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ];

  return parts.join('\r\n');
}

/**
 * Sends an email using the Gmail REST API (users.messages.send) via Google OAuth 2.0.
 */
export async function sendGmailMessage({
  to,
  subject,
  html,
  text,
}: SendGmailOptions): Promise<SendGmailResult> {
  try {
    const creds = await getGoogleCredentials();
    const accessToken = await getValidAccessToken();
    const fromEmail = creds.senderEmail || GMAIL_TARGET_ACCOUNT;

    const mimeString = buildMimeMessage({ to, from: fromEmail, subject, html, text });

    // Base64URL encoding (RFC 4648 §5)
    const raw = Buffer.from(mimeString)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error?.message || `Gmail API error HTTP ${res.status}`;
      console.error('[Gmail API Send Error]:', errMsg, data);
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
    };
  } catch (err: any) {
    console.error('[Gmail API Dispatch Exception]:', err.message);
    return { success: false, error: err.message };
  }
}
