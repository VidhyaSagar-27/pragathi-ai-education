/**
 * PRAGATHI AI — Multi-Channel Notification Templates
 * Generates formatted HTML emails, WhatsApp messages, and In-App notifications.
 */

export interface RegistrationAcceptedPayload {
  studentName: string;
  studentId: string;
  rollNumber?: string;
  schoolName?: string;
  registrationId?: string;
  classGrade: string;
  section?: string;
  parentName: string;
  mobileNumber: string;
  email?: string;
  loginEmail: string;
  temporaryPassword: string;
  portalUrl: string;
}

export interface RegistrationSubmittedPayload {
  studentName: string;
  registrationId: string;
  classGrade: string;
  section?: string;
  parentName: string;
  mobileNumber: string;
  email?: string;
  statusUrl: string;
}

export interface RegistrationRejectedPayload {
  studentName: string;
  registrationId?: string;
  notes?: string;
}

// ==========================================
// 1. WHATSAPP TEMPLATES
// ==========================================

export function formatWhatsAppRegistrationAccepted(p: RegistrationAcceptedPayload): string {
  const rollNo = p.rollNumber || p.loginEmail || p.studentId;
  const schoolText = p.schoolName ? `• School: *${p.schoolName}*\n` : '';

  return (
    `🎓 *Pragathi AI Education — Registration Details*\n\n` +
    `Hello *${p.studentName}*,\n\n` +
    `Welcome to Pragathi AI! Your student registration is complete and your account is active.\n\n` +
    `📋 *Student Details:*\n` +
    `• Roll Number (Login ID): *${rollNo}*\n` +
    `• Class: *Grade ${p.classGrade}*\n` +
    schoolText +
    `\n` +
    `🔑 *Your Student Login Credentials:*\n` +
    `• Login ID: *${rollNo}*\n` +
    `• Initial Password: *${p.temporaryPassword}*\n\n` +
    `👉 *Direct Portal Login:*\n` +
    `${p.portalUrl}\n\n` +
    `⚠️ *Important:* On your first sign-in, you will be prompted to set a new personal password.\n\n` +
    `Warm regards,\n*Team Pragathi AI*`
  );
}

export function formatWhatsAppRegistrationSubmitted(p: RegistrationSubmittedPayload): string {
  return (
    `📋 *Pragathi AI — Application Received*\n\n` +
    `Hello *${p.studentName}*,\n\n` +
    `Thank you for applying to the Pragathi AI Foundation Program.\n\n` +
    `• Registration ID: *${p.registrationId}*\n` +
    `• Class / Grade: *${p.classGrade}*\n` +
    `• Status: *PENDING REVIEW*\n\n` +
    `Our academic team is reviewing your application. Once accepted, you will receive login credentials automatically on this WhatsApp number.\n\n` +
    `👉 *Check Application Status Anytime:*\n` +
    `${p.statusUrl}\n\n` +
    `Warm regards,\n*Team Pragathi AI*`
  );
}

export function formatWhatsAppRegistrationRejected(p: RegistrationRejectedPayload): string {
  return (
    `📢 *Pragathi AI — Application Update*\n\n` +
    `Hello *${p.studentName}*,\n\n` +
    `Regarding your application` +
    (p.registrationId ? ` (ID: ${p.registrationId})` : '') +
    `:\n\n` +
    `Status: *NOT ACCEPTED*\n` +
    (p.notes ? `Reason: ${p.notes}\n\n` : '\n') +
    `If you believe this is an error or wish to submit updated information, please reach out to our admissions team.\n\n` +
    `Thank you,\n*Team Pragathi AI*`
  );
}

// ==========================================
// 2. HTML EMAIL TEMPLATES
// ==========================================

export function formatEmailRegistrationAccepted(p: RegistrationAcceptedPayload): { subject: string; html: string; text: string } {
  const rollNo = p.rollNumber || p.loginEmail || p.studentId;
  const subject = `Pragathi AI Education – Registration Details (${rollNo})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #0f172a; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0A192F 0%, #115E59 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; background-color: rgba(45, 212, 191, 0.2); color: #2dd4bf; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; }
    .content { padding: 32px 24px; }
    .card { background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 700; }
    .credentials { background-color: #0A192F; color: #ffffff; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: left; }
    .cred-row { margin-bottom: 10px; font-size: 14px; }
    .cred-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
    .cred-val { font-family: monospace; font-size: 16px; color: #2dd4bf; font-weight: 700; }
    .button { display: inline-block; background-color: #0d9488; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin-top: 16px; text-align: center; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Official Admission Confirmation</div>
      <h1>Welcome to Pragathi AI</h1>
      <p style="margin: 6px 0 0; color: #cbd5e1; font-size: 14px;">Foundation Program for School Students</p>
    </div>
    <div class="content">
      <p>Hello <strong>${p.studentName}</strong>,</p>
      <p>Congratulations! We are delighted to confirm that your registration for the <strong>Pragathi AI Education Platform</strong> is complete and your student account is active.</p>
      
      <div class="card">
        <div class="row"><span class="label">Roll Number:</span><span class="value" style="color: #0d9488; font-size: 16px;">${rollNo}</span></div>
        <div class="row"><span class="label">Student Name:</span><span class="value">${p.studentName}</span></div>
        <div class="row"><span class="label">Class / Grade:</span><span class="value">Grade ${p.classGrade}</span></div>
        ${p.schoolName ? `<div class="row"><span class="label">School:</span><span class="value">${p.schoolName}</span></div>` : ''}
        ${p.registrationId ? `<div class="row"><span class="label">Application Reference:</span><span class="value">${p.registrationId}</span></div>` : ''}
      </div>

      <div class="credentials">
        <div style="font-weight: 800; font-size: 15px; margin-bottom: 12px; color: #ffffff;">🔐 Official Student Login Credentials</div>
        <div class="cred-row">
          <div class="cred-label">Login ID / Roll Number:</div>
          <div class="cred-val">${rollNo}</div>
        </div>
        <div class="cred-row">
          <div class="cred-label">Initial Password:</div>
          <div class="cred-val">${p.temporaryPassword}</div>
        </div>
        <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">* On your first sign-in, you will be prompted to set a new personal password.</p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${p.portalUrl}" class="button">Access Student Learning Portal &rarr;</a>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.6;">
        Through this program, you will gain hands-on training across all 7 comprehensive AI curriculum modules, interactive quizzes, programming labs, and receive an authentic certificate upon completion.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Pragathi AI Education. All rights reserved.</p>
      <p>If you have any questions, reply to this email or visit our website.</p>
    </div>
  </div>
</body>
</html>
`;

  const text =
    `PRAGATHI AI EDUCATION - REGISTRATION DETAILS\n\n` +
    `Hello ${p.studentName},\n\n` +
    `Congratulations! Your registration for Pragathi AI Education is complete and your student account is active.\n\n` +
    `Roll Number: ${rollNo}\n` +
    `Class: Grade ${p.classGrade}\n` +
    (p.schoolName ? `School: ${p.schoolName}\n` : '') +
    (p.registrationId ? `Reference ID: ${p.registrationId}\n\n` : '\n') +
    `Your Student Account Credentials:\n` +
    `Login ID / Roll Number: ${rollNo}\n` +
    `Initial Password: ${p.temporaryPassword}\n\n` +
    `Student Portal: ${p.portalUrl}\n\n` +
    `* Note: On your first login, you will be prompted to set a new personal password.\n\n` +
    `Thank you,\nTeam Pragathi AI`;

  return { subject, html, text };
}

export function formatEmailRegistrationSubmitted(p: RegistrationSubmittedPayload): { subject: string; html: string; text: string } {
  const subject = `Pragathi AI – Application Received (${p.registrationId})`;
  const text =
    `Hello ${p.studentName},\n\n` +
    `Thank you for applying for the Pragathi AI Foundation Program.\n` +
    `Registration ID: ${p.registrationId}\n` +
    `Class: ${p.classGrade}\n\n` +
    `Status: PENDING REVIEW\n` +
    `Our admissions team is reviewing your application. You can check application status at:\n` +
    `${p.statusUrl}\n\n` +
    `Team Pragathi AI`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
  <div style="max-width: 550px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <h2 style="color: #0A192F;">Application Received</h2>
    <p>Hello <strong>${p.studentName}</strong>,</p>
    <p>We have successfully received your enrollment application for the Pragathi AI Foundation Program.</p>
    <div style="background: #f1f5f9; padding: 14px; border-radius: 8px; margin: 16px 0;">
      <div><strong>Registration ID:</strong> <span style="font-family: monospace; color: #0d9488;">${p.registrationId}</span></div>
      <div><strong>Class:</strong> ${p.classGrade}</div>
      <div><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">PENDING REVIEW</span></div>
    </div>
    <p>Once accepted, login credentials will be dispatched automatically via WhatsApp and Email.</p>
    <p><a href="${p.statusUrl}" style="display: inline-block; background: #0d9488; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Track Application Status &rarr;</a></p>
    <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Pragathi AI Education</p>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

// ==========================================
// 3. IN-APP NOTIFICATIONS
// ==========================================

export function formatInAppRegistrationAccepted(studentName: string, studentId: string): { title: string; message: string } {
  return {
    title: '🔔 Registration Accepted',
    message: `Your registration for the Pragathi AI Foundation Program has been accepted. Student ID: ${studentId}. Your student account is now active. Welcome to your learning journey!`,
  };
}
