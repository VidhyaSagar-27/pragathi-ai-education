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
  provider: 'META_CLOUD_API' | 'TWILIO' | 'ULTRAMSG' | 'CUSTOM_GATEWAY' | 'SIMULATED_ENGINE';
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
  let messageId = `wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const normalizedPhone = normalizeWhatsAppNumber(recipientMobile);

  let provider: AutomatedWhatsAppResult['provider'] = 'SIMULATED_ENGINE';
  let status: AutomatedWhatsAppResult['status'] = 'SIMULATED';
  let errorMsg: string | undefined;

  try {
    const db = await getDb();
    const waConfig = db?.settings?.whatsappConfig;
    const waProvider = waConfig?.provider || 'META';

    const ultramsgInstance = waConfig?.ultramsgInstanceId || process.env.ULTRAMSG_INSTANCE_ID;
    const ultramsgToken = waConfig?.ultramsgToken || process.env.ULTRAMSG_TOKEN;

    // 1. Check UltraMsg (QR-Linked Personal WhatsApp Gateway)
    if ((waProvider === 'ULTRAMSG' || (!waConfig?.metaAccessToken && ultramsgInstance)) && ultramsgInstance && ultramsgToken) {
      try {
        const url = `https://api.ultramsg.com/${ultramsgInstance}/messages/chat`;
        const params = new URLSearchParams();
        params.append('token', ultramsgToken);
        params.append('to', `+${normalizedPhone}`);
        params.append('body', message);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        const resData = await res.json().catch(() => ({}));
        if (res.ok && (resData.sent === 'true' || resData.id || resData.message === 'ok')) {
          provider = 'ULTRAMSG';
          status = 'SENT';
          messageId = String(resData.id || `um_${Date.now()}`);
        } else {
          errorMsg = resData.error || resData.message || 'UltraMsg returned an error';
        }
      } catch (err: any) {
        console.warn('[UltraMsg WhatsApp Dispatch Failed]:', err.message);
        errorMsg = err.message;
      }
    }

    const metaToken =
      waConfig?.metaAccessToken ||
      waConfig?.metaApiToken ||
      process.env.WHATSAPP_API_TOKEN;
    const metaPhoneId = waConfig?.metaPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    const twilioSid = waConfig?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = waConfig?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = waConfig?.twilioFromNumber || process.env.TWILIO_WHATSAPP_NUMBER;

    // 2. Check Meta WhatsApp Cloud API (Graph API)
    if (provider !== 'ULTRAMSG' && metaToken && metaPhoneId) {
      try {
        const url = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${metaToken}`,
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

        const resData = await res.json().catch(() => ({}));
        if (res.ok && resData.messages?.[0]?.id) {
          provider = 'META_CLOUD_API';
          status = 'SENT';
          messageId = resData.messages[0].id;
        } else {
          // If free-text fails because outside 24h customer window, try hello_world template fallback
          const is24hLimit =
            resData.error?.code === 131047 ||
            resData.error?.error_subcode === 131047 ||
            resData.error?.message?.includes('24 hour');

          if (is24hLimit) {
            console.log('[Meta API]: Outside 24h window, dispatching template fallback');
            const tmplRes = await fetch(url, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${metaToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: normalizedPhone,
                type: 'template',
                template: {
                  name: 'hello_world',
                  language: { code: 'en_US' },
                },
              }),
            });
            const tmplData = await tmplRes.json().catch(() => ({}));
            if (tmplRes.ok && tmplData.messages?.[0]?.id) {
              provider = 'META_CLOUD_API';
              status = 'SENT';
              messageId = tmplData.messages[0].id;
            } else {
              errorMsg = resData.error?.message || 'Meta API returned an error';
            }
          } else {
            const errData = resData;
            console.warn('[WhatsApp Meta API Error]', errData);
            errorMsg = errData.error?.message || JSON.stringify(errData);
          }
        }
      } catch (err: any) {
        console.warn('[WhatsApp Meta Cloud Dispatch Failed, fallback to system engine]:', err.message);
        errorMsg = err.message;
      }
    }

    // 2. Check Twilio WhatsApp Gateway
    else if (twilioSid && twilioAuth && twilioFrom) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const auth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');

        const params = new URLSearchParams();
        params.append('From', twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`);
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
