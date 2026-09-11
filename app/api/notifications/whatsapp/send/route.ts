import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { sendAutomatedWhatsAppMessage } from '@/lib/notifications/whatsapp';
import { noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    // Allow admin access or internal authorization
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin credentials required to trigger automated WhatsApp messages.' },
        { status: 403, headers: noCacheHeaders }
      );
    }

    const body = await req.json();
    const { recipientMobile, message, templateName, mediaUrl } = body;

    if (!recipientMobile || !message) {
      return NextResponse.json(
        { error: 'recipientMobile and message text are required.' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const result = await sendAutomatedWhatsAppMessage({
      recipientMobile,
      message,
      templateName: templateName || 'PRAGATHI AI Admin Manual Dispatch',
      mediaUrl,
    });

    return NextResponse.json(
      {
        success: result.success,
        provider: result.provider,
        status: result.status,
        messageId: result.messageId,
        recipient: recipientMobile,
        error: result.error,
        timestamp: new Date().toISOString(),
      },
      { headers: noCacheHeaders }
    );
  } catch (err: any) {
    console.error('WhatsApp API dispatch error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch automated WhatsApp message.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
