import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { triggerAutomationEvent } from '@/lib/automation/engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  try {
    const body = await req.json();
    const {
      studentUserId,
      registrationId,
      recipientPhone,
      recipientEmail,
      recipientName,
      actionType, // 'SEND_CREDENTIALS' | 'RESET_PASSWORD' | 'CUSTOM_MESSAGE'
      newPassword,
      customSubject,
      customMessage,
    } = body;

    const db = await getDb();
    const origin = req.nextUrl?.origin || 'https://pragathi-ai-education.vercel.app';

    // Find student if studentUserId or userId provided
    const targetUserId = studentUserId || body.userId;
    const studentUser = targetUserId
      ? db.users.find((u) => u.id === targetUserId || u.studentDetails?.studentId === targetUserId)
      : null;

    // Find registration if registrationId provided
    const registration = registrationId
      ? (db.registrations || []).find((r) => r.id === registrationId || r.registrationId === registrationId)
      : null;

    const targetName =
      studentUser?.name || registration?.studentName || recipientName || 'Student';
    const targetPhone =
      recipientPhone || studentUser?.phone || studentUser?.studentDetails?.parentPhone || registration?.mobileNumber;
    const targetEmail =
      recipientEmail || studentUser?.email || registration?.assignedEmail || registration?.email;
    const studentId = studentUser?.studentDetails?.studentId || registration?.studentId;

    if (!targetPhone && !targetEmail) {
      return NextResponse.json(
        { error: 'At least one contact method (phone or email) is required.' },
        { status: 400 }
      );
    }

    // 1. ACTION: SEND_CREDENTIALS
    if (actionType === 'SEND_CREDENTIALS') {
      const loginEmail = studentUser?.email || registration?.assignedEmail || targetEmail;
      const rawPassword = studentUser ? 'Pragathi2026!' : registration?.temporaryPassword || 'Pragathi2026!';

      const automationResult = await triggerAutomationEvent({
        event: 'CREDENTIALS_DISPATCH',
        studentId,
        studentName: targetName,
        registrationId: registration?.registrationId,
        recipientMobile: targetPhone,
        recipientEmail: targetEmail,
        performedBy: session.name || session.email || 'Admin',
        metadata: {
          classGrade: studentUser?.studentDetails?.classGrade || registration?.classGrade || '10',
          section: studentUser?.studentDetails?.section || registration?.section || 'A',
          parentName: studentUser?.studentDetails?.parentName || registration?.parentName || 'Parent',
          loginEmail,
          temporaryPassword: rawPassword,
          origin,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Credentials dispatched to ${targetName} via WhatsApp & Email.`,
        automation: automationResult.results,
      });
    }

    // 2. ACTION: RESET_PASSWORD
    if (actionType === 'RESET_PASSWORD') {
      const rawPw = newPassword || `Pragathi${Math.floor(1000 + Math.random() * 9000)}!`;
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(rawPw, salt);

      if (studentUser) {
        await updateDb((dbState) => {
          const u = dbState.users.find((user) => user.id === studentUser.id);
          if (u) {
            u.passwordHash = passwordHash;
            u.updatedAt = new Date().toISOString();
          }
        });
      } else if (registration) {
        await updateDb((dbState) => {
          const r = dbState.registrations.find((reg) => reg.id === registration.id);
          if (r) {
            r.temporaryPassword = rawPw;
          }
        });
      }

      const loginEmail = studentUser?.email || registration?.assignedEmail || targetEmail;

      const automationResult = await triggerAutomationEvent({
        event: 'PASSWORD_RESET',
        studentId,
        studentName: targetName,
        recipientMobile: targetPhone,
        recipientEmail: targetEmail,
        performedBy: session.name || session.email || 'Admin',
        metadata: {
          loginEmail,
          temporaryPassword: rawPw,
          origin,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Password reset and sent to ${targetName} successfully.`,
        newPassword: rawPw,
        automation: automationResult.results,
      });
    }

    // 3. ACTION: CUSTOM_MESSAGE
    if (actionType === 'CUSTOM_MESSAGE') {
      if (!customMessage?.trim()) {
        return NextResponse.json({ error: 'Message content cannot be empty.' }, { status: 400 });
      }

      const automationResult = await triggerAutomationEvent({
        event: 'CUSTOM_MESSAGE',
        studentId,
        studentName: targetName,
        recipientMobile: targetPhone,
        recipientEmail: targetEmail,
        performedBy: session.name || session.email || 'Admin',
        metadata: {
          subject: customSubject || 'Official Message from PRAGATHI AI',
          message: customMessage,
          origin,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Message sent to ${targetName} via WhatsApp & Email.`,
        automation: automationResult.results,
      });
    }

    return NextResponse.json({ error: 'Unrecognized actionType' }, { status: 400 });
  } catch (err: any) {
    console.error('Direct communication send error:', err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch message' }, { status: 500 });
  }
}
