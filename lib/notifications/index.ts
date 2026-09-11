import { getDb, saveDb } from '@/lib/db';
import { NotificationLog } from '@/lib/db/types';

export interface SendNotificationParams {
  type: 'EMAIL' | 'SMS' | 'OTP';
  recipient: string;
  subject?: string;
  message: string;
}

export async function dispatchNotification({
  type,
  recipient,
  subject,
  message,
}: SendNotificationParams): Promise<{ success: boolean; logId: string; status: 'SENT' | 'SIMULATED' }> {
  const logId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  let status: 'SENT' | 'SIMULATED' = 'SIMULATED';

  try {
    // If external SMTP or SMS API keys are present in env, real sending can be attempted
    if (type === 'EMAIL' && process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.NOTIFICATION_FROM_EMAIL || 'PRAGATHI AI <onboarding@resend.dev>',
            to: recipient,
            subject: subject || 'Notification from PRAGATHI AI',
            text: message,
          }),
        });
        if (res.ok) {
          status = 'SENT';
        }
      } catch (e) {
        console.warn('Resend email dispatch error, fallback to system log:', e);
      }
    }

    // Persist to Neon DB notifications log for audit and verification
    const db = await getDb();
    if (!db.notifications) {
      db.notifications = [];
    }

    const logEntry: NotificationLog = {
      id: logId,
      type,
      recipient,
      subject: subject || (type === 'OTP' ? 'PRAGATHI AI Verification OTP' : 'PRAGATHI AI Notification'),
      message,
      status,
      timestamp: new Date().toISOString(),
    };

    db.notifications.unshift(logEntry);
    if (db.notifications.length > 500) {
      db.notifications = db.notifications.slice(0, 500);
    }
    await saveDb(db);

    console.log(`[NOTIFICATION ${type}] to ${recipient}: ${message}`);
    return { success: true, logId, status };
  } catch (err) {
    console.error('Failed to log or send notification:', err);
    return { success: false, logId, status: 'SIMULATED' };
  }
}

export async function sendOtpAlert(recipient: string, otp: string, purpose: string) {
  const message = `Your PRAGATHI AI verification code for ${purpose} is: ${otp}. Valid for 10 minutes. Please do not share this code with anyone.`;
  return dispatchNotification({
    type: recipient.includes('@') ? 'EMAIL' : 'OTP',
    recipient,
    subject: 'PRAGATHI AI - Your Security Verification OTP',
    message,
  });
}

export async function sendRegistrationNotification(
  recipient: string,
  studentName: string,
  status: 'APPROVED' | 'REJECTED',
  notes?: string
) {
  const message =
    status === 'APPROVED'
      ? `Congratulations ${studentName}! Your PRAGATHI AI admission registration has been approved. You can now log in using your registered mobile number and password to access the AI curriculum, exams, and projects.`
      : `Dear ${studentName}, your PRAGATHI AI application status has been updated to ${status}. Reason: ${notes || 'Please verify credentials or contact administration.'}`;

  return dispatchNotification({
    type: recipient.includes('@') ? 'EMAIL' : 'SMS',
    recipient,
    subject: `PRAGATHI AI Admission: Application ${status}`,
    message,
  });
}

export async function sendExamResultAlert(
  recipient: string,
  studentName: string,
  examTitle: string,
  score: number,
  totalMarks: number,
  percentage: number,
  passed: boolean
) {
  const message = `Dear ${studentName}, your results for '${examTitle}' are declared. Score: ${score}/${totalMarks} (${percentage}%). Status: ${passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}. View your full scorecard on your student portal.`;
  return dispatchNotification({
    type: recipient.includes('@') ? 'EMAIL' : 'SMS',
    recipient,
    subject: `PRAGATHI AI Exam Result: ${examTitle}`,
    message,
  });
}
