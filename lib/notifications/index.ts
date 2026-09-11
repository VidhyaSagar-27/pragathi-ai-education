import { getDb, saveDb } from '@/lib/db';
import { NotificationLog } from '@/lib/db/types';
import { sendAutomatedWhatsAppMessage } from './whatsapp';

export { sendAutomatedWhatsAppMessage } from './whatsapp';

export interface SendNotificationParams {
  type: 'EMAIL' | 'SMS' | 'OTP' | 'WHATSAPP';
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
  // If WhatsApp, dispatch through automated WhatsApp engine
  if (type === 'WHATSAPP') {
    const waResult = await sendAutomatedWhatsAppMessage({
      recipientMobile: recipient,
      message,
      templateName: subject,
    });
    return {
      success: waResult.success,
      logId: waResult.messageId,
      status: waResult.status === 'SENT' ? 'SENT' : 'SIMULATED',
    };
  }

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

export async function sendApprovalCredentialsNotification({
  recipientMobile,
  recipientEmail,
  studentName,
  loginEmail,
  temporaryPassword,
  portalUrl,
}: {
  recipientMobile: string;
  recipientEmail?: string;
  studentName: string;
  loginEmail: string;
  temporaryPassword: string;
  portalUrl?: string;
}) {
  const cleanPhone = recipientMobile.replace(/\D/g, '').slice(-10);
  const directDashboardUrl = `https://pragathi-ai-education.vercel.app/register?tab=status&q=${cleanPhone}`;
  const portalLoginUrl = `https://pragathi-ai-education.vercel.app/login?email=${encodeURIComponent(loginEmail)}&role=STUDENT`;

  const whatsappMessage = `*PRAGATHI AI EDUCATION - ADMISSION APPROVED*\n\nDear ${studentName},\nCongratulations! Your application has been approved by the administration.\n\nHere are your official login credentials:\nStudent Name: ${studentName}\nLogin Email / ID: ${loginEmail}\nPassword: ${temporaryPassword}\n\n👉 Direct 1-Click Access to Student Portal:\n${directDashboardUrl}\n\n👉 Portal Login:\n${portalLoginUrl}\n\nPlease access your student dashboard and start your learning journey! Keep these credentials safe.`;

  const smsMessage = `PRAGATHI AI: Dear ${studentName}, your admission is approved! Email: ${loginEmail}, Password: ${temporaryPassword}. Direct Portal Access: ${directDashboardUrl}`;

  // 1. Dispatch/Log WhatsApp notification
  await dispatchNotification({
    type: 'WHATSAPP',
    recipient: recipientMobile,
    subject: 'PRAGATHI AI - Student Login Credentials (WhatsApp)',
    message: whatsappMessage,
  });

  // 2. Dispatch/Log SMS notification
  await dispatchNotification({
    type: 'SMS',
    recipient: recipientMobile,
    subject: 'PRAGATHI AI Admission Approved (SMS)',
    message: smsMessage,
  });

  // 3. If student has email, dispatch email notification
  if (recipientEmail && recipientEmail.includes('@')) {
    await dispatchNotification({
      type: 'EMAIL',
      recipient: recipientEmail,
      subject: 'Welcome to PRAGATHI AI - Your Login Credentials & Access Details',
      message: `Dear ${studentName},\n\nCongratulations! Your admission to PRAGATHI AI Education has been approved.\n\nYour Login Credentials:\n-------------------------\nStudent Portal: ${portalLoginUrl}\nDirect Access: ${directDashboardUrl}\nLogin Email: ${loginEmail}\nPassword: ${temporaryPassword}\n\nPlease keep these credentials secure and sign in to explore your curriculum.\n\nWarm regards,\nPRAGATHI AI Team`,
    });
  }
}

