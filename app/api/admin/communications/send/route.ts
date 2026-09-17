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
      recipientScope = 'INDIVIDUAL', // 'INDIVIDUAL' | 'BROADCAST' | 'SELECTED'
      channels: rawChannels,
      selectedStudentIds,
    } = body;

    const channels: ('WHATSAPP' | 'EMAIL')[] =
      Array.isArray(rawChannels) && rawChannels.length > 0
        ? rawChannels.filter((c) => c === 'WHATSAPP' || c === 'EMAIL')
        : ['WHATSAPP', 'EMAIL'];

    const db = await getDb();
    const origin = req.nextUrl?.origin || 'https://pragathi-ai-education.vercel.app';

    // =========================================================================
    // BROADCAST / SELECTED BATCH DISPATCH
    // =========================================================================
    if (recipientScope === 'BROADCAST' || recipientScope === 'SELECTED') {
      let targetStudents = (db.users || []).filter((u) => u.role === 'STUDENT');

      if (recipientScope === 'SELECTED' && Array.isArray(selectedStudentIds) && selectedStudentIds.length > 0) {
        targetStudents = targetStudents.filter(
          (u) =>
            selectedStudentIds.includes(u.id) ||
            (u.studentDetails?.studentId && selectedStudentIds.includes(u.studentDetails.studentId))
        );
      }

      if (targetStudents.length === 0) {
        return NextResponse.json(
          { error: 'No enrolled students found matching the selected broadcast criteria.' },
          { status: 400 }
        );
      }

      if (actionType === 'CUSTOM_MESSAGE' && !customMessage?.trim()) {
        return NextResponse.json({ error: 'Broadcast message content cannot be empty.' }, { status: 400 });
      }

      let emailSuccessCount = 0;
      let waSuccessCount = 0;
      const batchLogs: any[] = [];

      for (const s of targetStudents) {
        const sPhone = s.phone || s.studentDetails?.parentPhone;
        const sEmail = s.email;
        const sId = s.studentDetails?.studentId || s.id;

        const autoRes = await triggerAutomationEvent({
          event: actionType === 'SEND_CREDENTIALS' ? 'CREDENTIALS_DISPATCH' : 'CUSTOM_MESSAGE',
          studentId: sId,
          studentName: s.name,
          recipientMobile: sPhone,
          recipientEmail: sEmail,
          performedBy: session.name || session.email || 'Admin',
          channels,
          metadata: {
            subject: customSubject || 'Important Announcement from PRAGATHI AI',
            message: customMessage || '',
            classGrade: s.studentDetails?.classGrade || '10',
            section: s.studentDetails?.section || 'A',
            parentName: s.studentDetails?.parentName || 'Parent',
            loginEmail: s.email,
            temporaryPassword: 'Pragathi2026!',
            origin,
          },
        });

        if (autoRes.results?.EMAIL?.status === 'SENT') emailSuccessCount++;
        if (autoRes.results?.WHATSAPP?.status === 'DELIVERED') waSuccessCount++;

        batchLogs.push({
          studentId: sId,
          studentName: s.name,
          results: autoRes.results,
        });
      }

      let broadcastMsg = '';
      if (channels.includes('EMAIL') && channels.includes('WHATSAPP')) {
        broadcastMsg = `Broadcast finished: Email delivered to ${emailSuccessCount}/${targetStudents.length}, WhatsApp delivered to ${waSuccessCount}/${targetStudents.length}.`;
      } else if (channels.includes('EMAIL')) {
        broadcastMsg = `Broadcast finished: Email delivered to ${emailSuccessCount}/${targetStudents.length} students.`;
      } else {
        broadcastMsg = `Broadcast finished: WhatsApp delivered to ${waSuccessCount}/${targetStudents.length} students.`;
      }

      return NextResponse.json({
        success: true,
        message: broadcastMsg,
        scope: recipientScope,
        totalRecipients: targetStudents.length,
        delivered: {
          email: emailSuccessCount,
          whatsapp: waSuccessCount,
        },
        batchLogs,
      });
    }

    // =========================================================================
    // INDIVIDUAL DISPATCH
    // =========================================================================

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

    const channelSummary = channels.join(' & ');

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
        channels,
        metadata: {
          classGrade: studentUser?.studentDetails?.classGrade || registration?.classGrade || '10',
          section: studentUser?.studentDetails?.section || registration?.section || 'A',
          parentName: studentUser?.studentDetails?.parentName || registration?.parentName || 'Parent',
          loginEmail,
          temporaryPassword: rawPassword,
          origin,
        },
      });

      const emailSent = automationResult.results?.EMAIL?.status === 'SENT';
      const waDelivered = automationResult.results?.WHATSAPP?.status === 'DELIVERED';
      const waError = automationResult.results?.WHATSAPP?.errorReason;
      const emailError = automationResult.results?.EMAIL?.errorReason;

      let msg = '';
      let partialFailure = false;
      if (channels.includes('EMAIL') && channels.includes('WHATSAPP')) {
        if (emailSent && waDelivered) {
          msg = `Credentials dispatched to ${targetName} via Email & WhatsApp.`;
        } else if (emailSent && !waDelivered) {
          partialFailure = true;
          msg = `Credentials sent via Email. WhatsApp not delivered: ${waError || 'Blocked by provider'}.`;
        } else if (!emailSent && waDelivered) {
          partialFailure = true;
          msg = `Credentials delivered via WhatsApp. Email failed: ${emailError || 'Failed'}.`;
        } else {
          partialFailure = true;
          msg = `Failed to deliver credentials via both Email (${emailError}) and WhatsApp (${waError}).`;
        }
      } else if (channels.includes('EMAIL')) {
        partialFailure = !emailSent;
        msg = emailSent ? `Credentials sent to ${targetName} via Email.` : `Email failed: ${emailError}`;
      } else {
        partialFailure = !waDelivered;
        msg = waDelivered ? `Credentials delivered to ${targetName} via WhatsApp.` : `WhatsApp failed: ${waError}`;
      }

      return NextResponse.json({
        success: !partialFailure || emailSent || waDelivered,
        partialFailure,
        message: msg,
        automation: automationResult.results,
        delivery: {
          email: {
            dispatched: emailSent,
            messageId: automationResult.results?.EMAIL?.providerMessageId,
            error: emailError,
          },
          whatsapp: {
            dispatched: waDelivered,
            messageId: automationResult.results?.WHATSAPP?.providerMessageId,
            error: waError,
          },
        },
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

      const automationResult = await triggerAutomationEvent({
        event: 'CREDENTIALS_DISPATCH',
        studentId,
        studentName: targetName,
        registrationId: registration?.registrationId,
        recipientMobile: targetPhone,
        recipientEmail: targetEmail,
        performedBy: session.name || session.email || 'Admin',
        channels,
        metadata: {
          loginEmail: studentUser?.email || registration?.assignedEmail || targetEmail,
          temporaryPassword: rawPw,
          origin,
        },
      });

      const emailSent = automationResult.results?.EMAIL?.status === 'SENT';
      const waDelivered = automationResult.results?.WHATSAPP?.status === 'DELIVERED';
      const waError = automationResult.results?.WHATSAPP?.errorReason;
      const emailError = automationResult.results?.EMAIL?.errorReason;

      let msg = '';
      let partialFailure = false;
      if (channels.includes('EMAIL') && channels.includes('WHATSAPP')) {
        if (emailSent && waDelivered) {
          msg = `Password reset and dispatched to ${targetName} via Email & WhatsApp.`;
        } else if (emailSent && !waDelivered) {
          partialFailure = true;
          msg = `Password reset and sent via Email. WhatsApp not delivered: ${waError || 'Blocked by provider'}.`;
        } else if (!emailSent && waDelivered) {
          partialFailure = true;
          msg = `Password reset and delivered via WhatsApp. Email failed: ${emailError || 'Failed'}.`;
        } else {
          partialFailure = true;
          msg = `Password reset but failed to deliver via Email (${emailError}) and WhatsApp (${waError}).`;
        }
      } else if (channels.includes('EMAIL')) {
        partialFailure = !emailSent;
        msg = emailSent ? `Password reset and sent to ${targetName} via Email.` : `Email failed: ${emailError}`;
      } else {
        partialFailure = !waDelivered;
        msg = waDelivered ? `Password reset and delivered to ${targetName} via WhatsApp.` : `WhatsApp failed: ${waError}`;
      }

      return NextResponse.json({
        success: !partialFailure || emailSent || waDelivered,
        partialFailure,
        message: msg,
        newPassword: rawPw,
        automation: automationResult.results,
        delivery: {
          email: {
            dispatched: emailSent,
            messageId: automationResult.results?.EMAIL?.providerMessageId,
            error: emailError,
          },
          whatsapp: {
            dispatched: waDelivered,
            messageId: automationResult.results?.WHATSAPP?.providerMessageId,
            error: waError,
          },
        },
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
        channels,
        metadata: {
          subject: customSubject || 'Official Message from PRAGATHI AI',
          message: customMessage,
          origin,
        },
      });

      const emailSent = automationResult.results?.EMAIL?.status === 'SENT';
      const waDelivered = automationResult.results?.WHATSAPP?.status === 'DELIVERED';
      const waError = automationResult.results?.WHATSAPP?.errorReason;
      const emailError = automationResult.results?.EMAIL?.errorReason;

      let msg = '';
      let partialFailure = false;
      if (channels.includes('EMAIL') && channels.includes('WHATSAPP')) {
        if (emailSent && waDelivered) {
          msg = `Message dispatched to ${targetName} via Email & WhatsApp.`;
        } else if (emailSent && !waDelivered) {
          partialFailure = true;
          msg = `Message sent via Email. WhatsApp not delivered: ${waError || 'Blocked by provider'}.`;
        } else if (!emailSent && waDelivered) {
          partialFailure = true;
          msg = `Message delivered via WhatsApp. Email failed: ${emailError || 'Failed'}.`;
        } else {
          partialFailure = true;
          msg = `Failed to deliver message via Email (${emailError}) and WhatsApp (${waError}).`;
        }
      } else if (channels.includes('EMAIL')) {
        partialFailure = !emailSent;
        msg = emailSent ? `Message sent to ${targetName} via Email.` : `Email failed: ${emailError}`;
      } else {
        partialFailure = !waDelivered;
        msg = waDelivered ? `Message delivered to ${targetName} via WhatsApp.` : `WhatsApp failed: ${waError}`;
      }

      return NextResponse.json({
        success: !partialFailure || emailSent || waDelivered,
        partialFailure,
        message: msg,
        automation: automationResult.results,
        delivery: {
          email: {
            dispatched: emailSent,
            messageId: automationResult.results?.EMAIL?.providerMessageId,
            error: emailError,
          },
          whatsapp: {
            dispatched: waDelivered,
            messageId: automationResult.results?.WHATSAPP?.providerMessageId,
            error: waError,
          },
        },
      });
    }

    return NextResponse.json({ error: 'Unrecognized actionType' }, { status: 400 });
  } catch (err: any) {
    console.error('Direct communication send error:', err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch message' }, { status: 500 });
  }
}
