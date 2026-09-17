import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { AdminHelpRequest } from '@/lib/db/types';
import { triggerAutomationEvent } from '@/lib/automation/engine';
import { normalizePhone, normalizeEmail } from '@/lib/family/normalization';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST: Student / Instructor / Applicant submits a credential or help request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      requesterName,
      requesterRole, // 'STUDENT' | 'INSTRUCTOR' | 'APPLICANT'
      requesterPhone,
      requesterEmail,
      type, // 'PASSWORD_RESET' | 'USER_ID_REQUEST' | 'CREDENTIALS_REQUEST' | 'GENERAL_HELP'
      subject,
      message,
    } = body;

    if (!requesterName?.trim()) {
      return NextResponse.json({ error: 'Your full name is required.' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(requesterPhone);
    const cleanEmail = normalizeEmail(requesterEmail);

    if (!cleanPhone && !cleanEmail) {
      return NextResponse.json(
        { error: 'Please provide either a registered mobile number or email address.' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if matching student exists in DB
    let studentId: string | undefined;
    const matchedUser = db.users.find((u) => {
      const uPhone = normalizePhone(u.phone || u.studentDetails?.parentPhone);
      const uEmail = normalizeEmail(u.email || u.studentDetails?.parentEmail);
      return (cleanPhone && uPhone === cleanPhone) || (cleanEmail && uEmail === cleanEmail);
    });

    if (matchedUser) {
      studentId = matchedUser.studentDetails?.studentId || matchedUser.id;
    }

    const newRequest: AdminHelpRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      requesterName: requesterName.trim(),
      requesterRole: requesterRole || (matchedUser?.role as any) || 'STUDENT',
      requesterPhone: cleanPhone || requesterPhone,
      requesterEmail: cleanEmail || requesterEmail,
      studentId,
      type: type || 'CREDENTIALS_REQUEST',
      subject: subject?.trim() || `Request for ${type || 'Account Assistance'}`,
      message: message?.trim() || 'Request submitted to administration for assistance.',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    await updateDb((dbState) => {
      if (!dbState.helpRequests) dbState.helpRequests = [];
      dbState.helpRequests.unshift(newRequest);
    });

    return NextResponse.json({
      success: true,
      message: 'Your request has been delivered to PRAGATHI AI administrators. We will send credentials to your registered WhatsApp & Email.',
      requestId: newRequest.id,
    });
  } catch (err: any) {
    console.error('Support request submission error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit request' }, { status: 500 });
  }
}

// GET: Admin views all help & credential requests
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const db = await getDb();
  const requests = db.helpRequests || [];

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    resolved: requests.filter((r) => r.status === 'RESOLVED').length,
  };

  return NextResponse.json({ requests, stats }, { headers: noCacheHeaders });
}

// PATCH: Admin resolves request (1-click credential dispatch / password reset / reply)
export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  try {
    const body = await req.json();
    const { requestId, action, adminNotes, replyMessage } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const db = await getDb();
    const helpReq = (db.helpRequests || []).find((r) => r.id === requestId);
    if (!helpReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const origin = req.nextUrl?.origin || 'https://pragathi-ai-education.vercel.app';

    // Find linked student or user
    const cleanPhone = normalizePhone(helpReq.requesterPhone);
    const cleanEmail = normalizeEmail(helpReq.requesterEmail);

    const targetUser = db.users.find((u) => {
      const uPhone = normalizePhone(u.phone || u.studentDetails?.parentPhone);
      const uEmail = normalizeEmail(u.email || u.studentDetails?.parentEmail);
      return (
        (cleanPhone && uPhone === cleanPhone) ||
        (cleanEmail && uEmail === cleanEmail) ||
        (helpReq.studentId && u.studentDetails?.studentId === helpReq.studentId)
      );
    });

    const targetReg = (db.registrations || []).find((r) => {
      const rPhone = normalizePhone(r.mobileNumber);
      const rEmail = normalizeEmail(r.email);
      return (cleanPhone && rPhone === cleanPhone) || (cleanEmail && rEmail === cleanEmail);
    });

    // 1. ACTION: RESOLVE_WITH_CREDENTIALS
    if (action === 'RESOLVE_WITH_CREDENTIALS') {
      const loginEmail = targetUser?.email || targetReg?.assignedEmail || helpReq.requesterEmail;
      const rawPassword = targetReg?.temporaryPassword || 'Pragathi2026!';
      const studentId = targetUser?.studentDetails?.studentId || targetReg?.studentId;

      await triggerAutomationEvent({
        event: 'CREDENTIALS_DISPATCH',
        studentId,
        studentName: helpReq.requesterName,
        recipientMobile: helpReq.requesterPhone,
        recipientEmail: helpReq.requesterEmail || loginEmail,
        performedBy: session.name || session.email || 'Admin',
        metadata: {
          classGrade: targetUser?.studentDetails?.classGrade || targetReg?.classGrade || '10',
          section: targetUser?.studentDetails?.section || targetReg?.section || 'A',
          parentName: targetUser?.studentDetails?.parentName || targetReg?.parentName || 'Parent',
          loginEmail,
          temporaryPassword: rawPassword,
          origin,
        },
      });

      await updateDb((dbState) => {
        const item = (dbState.helpRequests || []).find((r) => r.id === requestId);
        if (item) {
          item.status = 'RESOLVED';
          item.adminNotes = adminNotes || 'Credentials dispatched to student WhatsApp & Email.';
          item.resolvedAt = new Date().toISOString();
        }
      });

      return NextResponse.json({
        success: true,
        message: `Credentials sent to ${helpReq.requesterName} and request marked as Resolved.`,
      });
    }

    // 2. ACTION: RESOLVE_WITH_RESET
    if (action === 'RESOLVE_WITH_RESET') {
      const rawPw = `Pragathi${Math.floor(1000 + Math.random() * 9000)}!`;
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(rawPw, salt);

      if (targetUser) {
        await updateDb((dbState) => {
          const u = dbState.users.find((user) => user.id === targetUser.id);
          if (u) {
            u.passwordHash = passwordHash;
            u.updatedAt = new Date().toISOString();
          }
        });
      }

      const loginEmail = targetUser?.email || targetReg?.assignedEmail || helpReq.requesterEmail;

      await triggerAutomationEvent({
        event: 'PASSWORD_RESET',
        studentId: targetUser?.studentDetails?.studentId,
        studentName: helpReq.requesterName,
        recipientMobile: helpReq.requesterPhone,
        recipientEmail: helpReq.requesterEmail || loginEmail,
        performedBy: session.name || session.email || 'Admin',
        metadata: {
          loginEmail,
          temporaryPassword: rawPw,
          origin,
        },
      });

      await updateDb((dbState) => {
        const item = (dbState.helpRequests || []).find((r) => r.id === requestId);
        if (item) {
          item.status = 'RESOLVED';
          item.adminNotes = adminNotes || `Password reset to ${rawPw} and dispatched.`;
          item.resolvedAt = new Date().toISOString();
        }
      });

      return NextResponse.json({
        success: true,
        message: `Password reset to ${rawPw} and dispatched to ${helpReq.requesterName}.`,
      });
    }

    // 3. ACTION: RESOLVE_WITH_MESSAGE
    if (action === 'RESOLVE_WITH_MESSAGE') {
      const msg = replyMessage || adminNotes || 'Your administrative request has been processed.';
      await triggerAutomationEvent({
        event: 'CUSTOM_MESSAGE',
        studentName: helpReq.requesterName,
        recipientMobile: helpReq.requesterPhone,
        recipientEmail: helpReq.requesterEmail,
        performedBy: session.name || session.email || 'Admin',
        metadata: {
          subject: 'PRAGATHI AI – Support Request Resolution',
          message: msg,
          origin,
        },
      });

      await updateDb((dbState) => {
        const item = (dbState.helpRequests || []).find((r) => r.id === requestId);
        if (item) {
          item.status = 'RESOLVED';
          item.adminNotes = msg;
          item.resolvedAt = new Date().toISOString();
        }
      });

      return NextResponse.json({
        success: true,
        message: `Reply dispatched to ${helpReq.requesterName} and request marked as Resolved.`,
      });
    }

    // 4. ACTION: DISMISS
    if (action === 'DISMISS') {
      await updateDb((dbState) => {
        const item = (dbState.helpRequests || []).find((r) => r.id === requestId);
        if (item) {
          item.status = 'RESOLVED';
          item.adminNotes = adminNotes || 'Dismissed by administrator.';
          item.resolvedAt = new Date().toISOString();
        }
      });

      return NextResponse.json({ success: true, message: 'Request marked as resolved.' });
    }

    return NextResponse.json({ error: 'Unrecognized action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Support resolution error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update request' }, { status: 500 });
  }
}
