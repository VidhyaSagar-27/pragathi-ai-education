import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, noCacheHeaders } from '@/lib/db';
import { retryAutomationNotification } from '@/lib/automation/engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const db = await getDb();
  const logs = db.automationLogs || [];

  // Provider configuration detection
  const providers = {
    whatsapp: {
      provider: process.env.WHATSAPP_API_TOKEN
        ? 'Meta WhatsApp Cloud API'
        : process.env.TWILIO_AUTH_TOKEN
        ? 'Twilio WhatsApp API'
        : 'Not Configured',
      configured: Boolean(
        (process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) ||
          (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
      ),
    },
    email: {
      provider: process.env.RESEND_API_KEY
        ? 'Resend Transactional API'
        : process.env.SMTP_HOST
        ? 'SMTP Host'
        : 'Not Configured',
      configured: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    },
    inApp: {
      provider: 'Pragathi AI In-App Database Engine',
      configured: true,
    },
    push: {
      provider: 'Web Push (VAPID Service Worker)',
      configured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    },
  };

  const stats = {
    total: logs.length,
    delivered: logs.filter((l) => l.status === 'DELIVERED').length,
    sent: logs.filter((l) => l.status === 'SENT').length,
    failed: logs.filter((l) => l.status === 'FAILED').length,
    notConfigured: logs.filter((l) => l.status === 'NOT_CONFIGURED').length,
    byChannel: {
      WHATSAPP: logs.filter((l) => l.channel === 'WHATSAPP').length,
      EMAIL: logs.filter((l) => l.channel === 'EMAIL').length,
      IN_APP: logs.filter((l) => l.channel === 'IN_APP').length,
      PUSH: logs.filter((l) => l.channel === 'PUSH').length,
    },
  };

  return NextResponse.json({ logs, providers, stats }, { headers: noCacheHeaders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  try {
    const body = await req.json();
    const { logId } = body;
    if (!logId) {
      return NextResponse.json({ error: 'logId is required' }, { status: 400 });
    }

    const result = await retryAutomationNotification(logId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Automation retry error:', err);
    return NextResponse.json({ error: err.message || 'Retry failed' }, { status: 500 });
  }
}
