/**
 * PRAGATHI AI - WhatsApp Message Automation Engine
 * Supports automated delivery via:
 * 1. Meta WhatsApp Cloud API (Graph API)
 * 2. Twilio WhatsApp API
 * 3. Custom Webhook / UltraMsg Gateway
 * 4. Automated Database Audit Logging & Direct Dispatch
 */

import { getDb, saveDb } from '@/lib/db';
import { NotificationLog } from '@/lib/db/types';

export interface AutomatedWhatsAppOptions {
  recipientMobile: string;
  message: string;
  templateName?: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

export interface AutomatedWhatsAppResult {
  success: boolean;
  messageId: string;
  provider: 'META_CLOUD_API' | 'TWILIO' | 'CUSTOM_GATEWAY' | 'SIMULATED_ENGINE';
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  error?: string;
}

/**
 * Normalizes phone numbers to international format: e.g. "9618611522" -> "919618611522"
 */
export function normalizeWhatsAppNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits || rawPhone;
}

/**
 * Dispatches an automated WhatsApp message to a recipient
 */
export async function sendAutomatedWhatsAppMessage({
  recipientMobile,
  message,
  templateName,
  mediaUrl,
  metadata,
}: AutomatedWhatsAppOptions): Promise<AutomatedWhatsAppResult> {
  const messageId = `wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const normalizedPhone = normalizeWhatsAppNumber(recipientMobile);

  let provider: AutomatedWhatsAppResult['provider'] = 'SIMULATED_ENGINE';
  let status: AutomatedWhatsAppResult['status'] = 'SIMULATED';
  let errorMsg: string | undefined;

  try {
    // 1. Check Meta WhatsApp Cloud API (Graph API)
    if (process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizedPhone,
            type: 'text',
            text: { preview_url: true, body: message },
          }),
        });

        if (res.ok) {
          provider = 'META_CLOUD_API';
          status = 'SENT';
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn('[WhatsApp Meta API Error]', errData);
          errorMsg = JSON.stringify(errData);
        }
      } catch (err: any) {
        console.warn('[WhatsApp Meta Cloud Dispatch Failed, fallback to system engine]:', err.message);
        errorMsg = err.message;
      }
    }

    // 2. Check Twilio WhatsApp Gateway
    else if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
    ) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64');

        const params = new URLSearchParams();
        params.append('From', `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`);
        params.append('To', `whatsapp:+${normalizedPhone}`);
        params.append('Body', message);
        if (mediaUrl) params.append('MediaUrl', mediaUrl);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (res.ok) {
          provider = 'TWILIO';
          status = 'SENT';
        }
      } catch (err: any) {
        console.warn('[Twilio WhatsApp Dispatch Failed]:', err.message);
        errorMsg = err.message;
      }
    }

    // 3. Check Custom Webhook / UltraMsg Gateway
    else if (process.env.WHATSAPP_WEBHOOK_URL) {
      try {
        const res = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: normalizedPhone,
            message,
            templateName,
            mediaUrl,
            timestamp: new Date().toISOString(),
          }),
        });

        if (res.ok) {
          provider = 'CUSTOM_GATEWAY';
          status = 'SENT';
        }
      } catch (err: any) {
        console.warn('[Custom WhatsApp Gateway Failed]:', err.message);
        errorMsg = err.message;
      }
    }

    // 4. Record to Database Notification Log for Audit & Live Tracking
    const db = await getDb();
    if (!db.notifications) {
      db.notifications = [];
    }

    const logEntry: NotificationLog = {
      id: messageId,
      type: 'WHATSAPP',
      recipient: normalizedPhone,
      subject: templateName || 'PRAGATHI AI WhatsApp Automation',
      message,
      status: status,
      timestamp: new Date().toISOString(),
    };

    db.notifications.unshift(logEntry);
    if (db.notifications.length > 500) {
      db.notifications = db.notifications.slice(0, 500);
    }
    await saveDb(db);

    console.log(`[AUTOMATED WHATSAPP ${provider} -> +${normalizedPhone}]: ${message.substring(0, 100)}...`);

    return {
      success: true,
      messageId,
      provider,
      status,
      error: errorMsg,
    };
  } catch (globalErr: any) {
    console.error('Failed automated WhatsApp dispatch:', globalErr);
    return {
      success: false,
      messageId,
      provider,
      status: 'FAILED',
      error: globalErr.message,
    };
  }
}
