import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { triggerAutomationEvent } from '@/lib/automation/engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized. Requires Admin or Instructor session.' }, { status: 403, headers: noCacheHeaders });
  }

  try {
    const body = await req.json();
    const {
      studentUserId,
      userId,
      registrationId,
      recipientPhone,
      recipientEmail,
      recipientName,
      actionType, // 'SEND_CREDENTIALS' | 'RESET_PASSWORD' | 'CUSTOM_MESSAGE'
      newPassword,
      customSubject,
      customMessage,
      recipientScope = 'INDIVIDUAL', // 'INDIVIDUAL' | 'BROADCAST' | 'SELECTED' | 'MANUAL'
      targetRole = 'STUDENT', // 'STUDENT' | 'INSTRUCTOR'
      role, // role override
      channels: rawChannels,
      selectedStudentIds,
      selectedUserIds,
    } = body;

    const channels: ('WHATSAPP' | 'EMAIL')[] =
      Array.isArray(rawChannels) && rawChannels.length > 0
        ? rawChannels.filter((c) => c === 'WHATSAPP' || c === 'EMAIL')
        : ['WHATSAPP', 'EMAIL'];

    const db = await getDb();
    const origin = req.nextUrl?.origin || 'https://pragathi-ai-education.vercel.app';

    // Instructors can only broadcast to students; only admins can broadcast to faculty
    const effectiveBroadcastRole =
      session.role === 'ADMIN' && targetRole === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

    // =========================================================================
    // 1. BROADCAST / SELECTED BATCH DISPATCH
    // =========================================================================
    if (recipientScope === 'BROADCAST' || recipientScope === 'SELECTED') {
      let targetUsers = (db.users || []).filter((u) => u.role === effectiveBroadcastRole);

      const selectedIds = selectedStudentIds || selectedUserIds;
      if (recipientScope === 'SELECTED' && Array.isArray(selectedIds) && selectedIds.length > 0) {
        targetUsers = targetUsers.filter(
          (u) =>
            selectedIds.includes(u.id) ||
            (u.studentDetails?.studentId && selectedIds.includes(u.studentDetails.studentId))
        );
      }

      if (targetUsers.length === 0) {
        return NextResponse.json(
          { error: `No ${effectiveBroadcastRole.toLowerCase()}s found matching the selected broadcast criteria.` },
          { status: 400 }
        );
      }

      if (actionType === 'CUSTOM_MESSAGE' && !customMessage?.trim()) {
        return NextResponse.json({ error: 'Broadcast message content cannot be empty.' }, { status: 400 });
      }

      let emailSuccessCount = 0;
      let waSuccessCount = 0;
      const batchLogs: any[] = [];

      for (const u of targetUsers) {
        const sPhone = u.phone || u.studentDetails?.parentPhone;
        const sEmail = u.email;
        const sId = u.studentDetails?.studentId || u.id;

        const autoRes = await triggerAutomationEvent({
          event: actionType === 'SEND_CREDENTIALS' ? 'CREDENTIALS_DISPATCH' : 'CUSTOM_MESSAGE',
          studentId: sId,
          studentName: u.name,
          recipientMobile: sPhone,
          recipientEmail: sEmail,
          performedBy: session.name || session.email || (session.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'),
          channels,
          metadata: {
            role: effectiveBroadcastRole,
            instructorName: session.role === 'INSTRUCTOR' ? session.name : undefined,
            subject:
              customSubject ||
              (effectiveBroadcastRole === 'INSTRUCTOR'
                ? 'Important Notice for Faculty'
                : 'Important Announcement from PRAGATHI AI'),
            message: customMessage || '',
            classGrade: u.studentDetails?.classGrade || '10',
            section: u.studentDetails?.section || 'A',
            parentName: u.studentDetails?.parentName || 'Parent',
            loginEmail: u.email,
            temporaryPassword: effectiveBroadcastRole === 'INSTRUCTOR' ? 'Faculty2026!' : 'Pragathi2026!',
            origin,
          },
        });

        if (autoRes.results?.EMAIL?.status === 'SENT') emailSuccessCount++;
        if (autoRes.results?.WHATSAPP?.status === 'DELIVERED') waSuccessCount++;

        batchLogs.push({
          userId: u.id,
          name: u.name,
          results: autoRes.results,
        });
      }

      const roleLabel = effectiveBroadcastRole === 'INSTRUCTOR' ? 'faculty members' : 'students';
      let broadcastMsg = '';
      if (channels.includes('EMAIL') && channels.includes('WHATSAPP')) {
        broadcastMsg = `Broadcast finished: Email delivered to ${emailSuccessCount}/${targetUsers.length}, WhatsApp delivered to ${waSuccessCount}/${targetUsers.length} ${roleLabel}.`;
      } else if (channels.includes('EMAIL')) {
        broadcastMsg = `Broadcast finished: Email delivered to ${emailSuccessCount}/${targetUsers.length} ${roleLabel}.`;
      } else {
        broadcastMsg = `Broadcast finished: WhatsApp delivered to ${waSuccessCount}/${targetUsers.length} ${roleLabel}.`;
      }

      return NextResponse.json({
        success: true,
        message: broadcastMsg,
        scope: recipientScope,
        totalRecipients: targetUsers.length,
        delivered: {
          email: emailSuccessCount,
          whatsapp: waSuccessCount,
        },
        batchLogs,
      });
    }

    // =========================================================================
    // 2. INDIVIDUAL & MANUAL DISPATCH
    // =========================================================================
    const targetUserId = studentUserId || userId;
    let userRecord = targetUserId
      ? db.users.find((u) => u.id === targetUserId || u.studentDetails?.studentId === targetUserId)
      : null;

    // In MANUAL mode, look up existing user by phone or email if not provided by ID
    if (!userRecord && (recipientEmail || recipientPhone)) {
      const cleanPhone = recipientPhone ? String(recipientPhone).replace(/\D/g, '') : '';
      userRecord =
        (db.users || []).find((u) => {
          if (recipientEmail && u.email && u.email.toLowerCase() === recipientEmail.toLowerCase()) return true;
          if (cleanPhone && u.phone && u.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10))) return true;
          return false;
        }) || null;
    }

    // Find registration if registrationId provided
    const registration = registrationId
      ? (db.registrations || []).find((r) => r.id === registrationId || r.registrationId === registrationId)
      : null;

    const effectiveRole = role || userRecord?.role || (targetRole === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT');
    const defaultName = effectiveRole === 'INSTRUCTOR' ? 'Faculty Member' : 'Student';
    const targetName = recipientName || userRecord?.name || registration?.studentName || defaultName;
    const targetPhone =
      recipientPhone || userRecord?.phone || userRecord?.studentDetails?.parentPhone || registration?.mobileNumber;
    const targetEmail =
      recipientEmail || userRecord?.email || registration?.assignedEmail || registration?.email;
    const targetId = userRecord?.studentDetails?.studentId || registration?.studentId || userRecord?.id;

    if (!targetPhone && !targetEmail) {
      return NextResponse.json(
        { error: 'At least one contact method (phone or email) is required.' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 2A. ACTION: SEND_CREDENTIALS
    // -------------------------------------------------------------------------
    if (actionType === 'SEND_CREDENTIALS') {
      const loginEmail = userRecord?.email || registration?.assignedEmail || targetEmail;
      const rawPassword =
        effectiveRole === 'INSTRUCTOR'
          ? newPassword || 'Faculty2026!'
          : userRecord
          ? 'Pragathi2026!'
          : registration?.temporaryPassword || 'Pragathi2026!';

      const automationResult = await triggerAutomationEvent({
        event: 'CREDENTIALS_DISPATCH',
        studentId: targetId,
        studentName: targetName,
        registrationId: registration?.registrationId,
        recipientMobile: targetPhone,
        recipientEmail: targetEmail,
        performedBy: session.name || session.email || (session.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'),
        channels,
        metadata: {
          role: effectiveRole,
          classGrade: userRecord?.studentDetails?.classGrade || registration?.classGrade || '10',
          section: userRecord?.studentDetails?.section || registration?.section || 'A',
          parentName: userRecord?.studentDetails?.parentName || registration?.parentName || 'Parent',
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

    // -------------------------------------------------------------------------
    // 2B. ACTION: RESET_PASSWORD
    // -------------------------------------------------------------------------
    if (actionType === 'RESET_PASSWORD') {
      const defaultPw = effectiveRole === 'INSTRUCTOR' ? 'Faculty2026!' : `Pragathi${Math.floor(1000 + Math.random() * 9000)}!`;
      const rawPw = newPassword || defaultPw;
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(rawPw, salt);

      if (userRecord) {
        await updateDb((dbState) => {
          const u = dbState.users.find((user) => user.id === userRecord.id);
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
        event: 'PASSWORD_RESET',
        studentId: targetId,
        studentName: targetName,
        registrationId: registration?.registrationId,
        recipientMobile: targetPhone,
        recipientEmail: targetEmail,
        performedBy: session.name || session.email || (session.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'),
        channels,
        metadata: {
          role: effectiveRole,
          loginEmail: userRecord?.email || registration?.assignedEmail || targetEmail,
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

    // -------------------------------------------------------------------------
    // 2C. ACTION: CUSTOM_MESSAGE
    // -------------------------------------------------------------------------
    if (actionType === 'CUSTOM_MESSAGE') {
      if (!customMessage?.trim()) {
        return NextResponse.json({ error: 'Message content cannot be empty.' }, { status: 400 });
      }

      const defaultSubject =
        effectiveRole === 'INSTRUCTOR'
          ? 'Official Notice for Faculty'
          : session.role === 'INSTRUCTOR'
          ? `Message from Instructor ${session.name || ''}`
          : 'Official Message from PRAGATHI AI';

      const automationResult = await triggerAutomationEvent({
        event: 'CUSTOM_MESSAGE',
        studentId: targetId,
        studentName: targetName,
        recipientMobile: targetPhone,
        recipientEmail: targetEmail,
        performedBy: session.name || session.email || (session.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'),
        channels,
        metadata: {
          role: effectiveRole,
          instructorName: session.role === 'INSTRUCTOR' ? session.name : undefined,
          subject: customSubject || defaultSubject,
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
