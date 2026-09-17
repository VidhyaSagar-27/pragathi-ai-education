import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, generateStudentId, noCacheHeaders } from '@/lib/db';
import { User, StudentRegistration, AuditLogEntry } from '@/lib/db/types';
import { triggerAutomationEvent } from '@/lib/automation/engine';
import { normalizePhone, normalizeEmail } from '@/lib/family/normalization';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const db = await getDb();
  const registrations = (db.registrations || []).map((reg) => {
    // Dynamically calculate or enrich duplicateMatches if not present
    let duplicates = reg.duplicateMatches || [];
    if (duplicates.length === 0) {
      const cleanPhone = normalizePhone(reg.mobileNumber);
      const cleanEmail = normalizeEmail(reg.email);
      const cleanName = (reg.studentName || '').toLowerCase().trim();

      // Check existing students
      for (const u of db.users || []) {
        if (u.role === 'STUDENT' && u.email !== reg.assignedEmail) {
          const uPhone = normalizePhone(u.studentDetails?.parentPhone || u.phone);
          const uEmail = normalizeEmail(u.studentDetails?.parentEmail || u.email);
          const uName = (u.name || '').toLowerCase().trim();

          const phoneMatch = cleanPhone && uPhone === cleanPhone;
          const emailMatch = cleanEmail && uEmail === cleanEmail;
          const nameMatch = cleanName && uName === cleanName;

          if (phoneMatch || emailMatch || nameMatch) {
            duplicates.push({
              matchedRecordId: u.studentDetails?.studentId || u.id,
              type: 'STUDENT',
              studentName: u.name,
              studentId: u.studentDetails?.studentId,
              classGrade: u.studentDetails?.classGrade,
              guardianPhone: u.studentDetails?.parentPhone || u.phone || '',
              guardianEmail: u.studentDetails?.parentEmail || u.email,
              matchedFields: [
                phoneMatch ? 'PHONE' : null,
                emailMatch ? 'EMAIL' : null,
                nameMatch ? 'NAME' : null,
              ].filter(Boolean) as any[],
              matchDescription: phoneMatch && !nameMatch
                ? 'Shared guardian phone with enrolled student (Sibling/Family member)'
                : 'Matching contact or student name on file',
              reason: phoneMatch && !nameMatch
                ? 'Shared guardian phone with enrolled student (Sibling/Family member)'
                : 'Matching contact or student name on file',
            });
          }
        }
      }
    }

    return {
      ...reg,
      duplicateMatches: duplicates,
    };
  });

  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === 'PENDING').length,
    needsReview: registrations.filter((r) => r.status === 'NEEDS_REVIEW').length,
    accepted: registrations.filter((r) => r.status === 'ACCEPTED' || r.status === 'APPROVED').length,
    rejected: registrations.filter((r) => r.status === 'REJECTED').length,
  };

  return NextResponse.json({ registrations, stats }, { headers: noCacheHeaders });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, action, initialPassword, customEmail, notes } = body;

    const validActions = [
      'ACCEPT',
      'APPROVE',
      'ACCEPT_AS_SIBLING',
      'REJECT',
      'NEEDS_REVIEW',
      'MARK_PENDING',
    ];

    if (!id || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Registration ID and a valid action (${validActions.join(', ')}) are required.` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const reg = (db.registrations || []).find((r) => r.id === id);
    if (!reg) {
      return NextResponse.json({ error: 'Registration application not found.' }, { status: 404 });
    }

    // ==========================================
    // ACTION: ACCEPT / ACCEPT_AS_SIBLING / APPROVE
    // ==========================================
    if (action === 'ACCEPT' || action === 'ACCEPT_AS_SIBLING' || action === 'APPROVE') {
      // Idempotency: If student is already accepted and has a Student ID, return existing details
      if ((reg.status === 'ACCEPTED' || reg.status === 'APPROVED') && reg.studentId) {
        return NextResponse.json({
          success: true,
          message: `Application is already accepted with Student ID ${reg.studentId}.`,
          studentId: reg.studentId,
          createdStudent: {
            email: reg.assignedEmail,
            studentId: reg.studentId,
            name: reg.studentName,
            phone: reg.mobileNumber,
          },
        });
      }

      // 1. Atomic Student ID Generation (PAI26-XXXX)
      const studentId = await generateStudentId();

      // 2. Resolve Unique Student Login Email
      let studentEmail = (
        customEmail ||
        reg.assignedEmail ||
        reg.email ||
        `${reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pragathiai.student`
      ).trim().toLowerCase();

      // Ensure email uniqueness so admin is NEVER blocked (supports multiple siblings with same parent email)
      if (db.users.some((u) => u.email.toLowerCase() === studentEmail)) {
        const base = reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student';
        const numSuffix = studentId.replace(/\D/g, '').slice(-4) || Math.random().toString(36).substring(2, 6);
        studentEmail = `${base}_${numSuffix}@pragathiai.student`;
      }

      // 3. Password Generation & Hashing
      const rawPassword = initialPassword || reg.temporaryPassword || 'Pragathi2026!';
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(rawPassword, salt);

      // 4. Create New Student User Account
      const newStudentUser: User = {
        id: `usr_stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: reg.studentName,
        email: studentEmail,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: reg.mobileNumber,
        studentDetails: {
          studentId,
          classGrade: reg.classGrade,
          section: reg.section,
          schoolName: reg.schoolName,
          parentName: reg.parentName,
          location: reg.location,
          group: 'Foundation Batch A',
          photoUrl: reg.photoUrl,
          studentCode: reg.studentCode || 'STU',
          parentPhone: reg.mobileNumber,
          parentEmail: reg.email,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 5. Update Registration Record
      await updateDb((dbState) => {
        const item = dbState.registrations.find((r) => r.id === id);
        if (item) {
          item.status = 'ACCEPTED';
          item.studentId = studentId;
          item.assignedEmail = studentEmail;
          item.temporaryPassword = rawPassword;
          item.approvedAt = new Date().toISOString();
          if (notes) item.notes = notes;
        }

        // Add user if not already in array
        if (!dbState.users.some((u) => u.email.toLowerCase() === studentEmail)) {
          dbState.users.push(newStudentUser);
        }

        // Add audit log entry
        if (!dbState.auditLogs) dbState.auditLogs = [];
        const auditLog: AuditLogEntry = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'REGISTRATION_ACCEPTED',
          targetEntity: 'STUDENT_REGISTRATION',
          targetId: id,
          performedBy: session.name || session.email || 'Admin',
          details: {
            studentId,
            studentName: reg.studentName,
            loginEmail: studentEmail,
            acceptedAsSibling: action === 'ACCEPT_AS_SIBLING',
            registrationId: reg.registrationId,
          },
          timestamp: new Date().toISOString(),
        };
        dbState.auditLogs.unshift(auditLog);
      });

      // 6. Multi-Channel Automation (Single Action Server-side Execution)
      const origin = req.nextUrl?.origin || 'https://pragathi-ai-education.vercel.app';
      const automationResult = await triggerAutomationEvent({
        event: 'REGISTRATION_ACCEPTED',
        studentId,
        studentName: reg.studentName,
        registrationId: reg.registrationId || reg.id,
        recipientMobile: reg.mobileNumber,
        recipientEmail: reg.email || studentEmail,
        performedBy: session.name || session.email || 'Admin',
        metadata: {
          classGrade: reg.classGrade,
          section: reg.section,
          parentName: reg.parentName,
          loginEmail: studentEmail,
          temporaryPassword: rawPassword,
          origin,
          acceptedAsSibling: action === 'ACCEPT_AS_SIBLING',
          notes,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Student accepted successfully! Assigned Student ID: ${studentId}`,
        studentId,
        createdStudent: {
          email: studentEmail,
          temporaryPassword: rawPassword,
          studentId,
          name: reg.studentName,
          phone: reg.mobileNumber,
        },
        automation: automationResult.results,
      });
    }

    // ==========================================
    // ACTION: REJECT
    // ==========================================
    if (action === 'REJECT') {
      await updateDb((dbState) => {
        const item = dbState.registrations.find((r) => r.id === id);
        if (item) {
          item.status = 'REJECTED';
          if (notes) item.notes = notes;
        }

        if (!dbState.auditLogs) dbState.auditLogs = [];
        dbState.auditLogs.unshift({
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'REGISTRATION_REJECTED',
          targetEntity: 'STUDENT_REGISTRATION',
          targetId: id,
          performedBy: session.name || session.email || 'Admin',
          details: { studentName: reg.studentName, notes },
          timestamp: new Date().toISOString(),
        });
      });

      // Trigger notification if parent email/phone exists
      await triggerAutomationEvent({
        event: 'REGISTRATION_REJECTED',
        studentName: reg.studentName,
        registrationId: reg.registrationId || reg.id,
        recipientMobile: reg.mobileNumber,
        recipientEmail: reg.email,
        performedBy: session.name || session.email || 'Admin',
        metadata: { notes },
      });

      return NextResponse.json({
        success: true,
        message: 'Registration application rejected.',
      });
    }

    // ==========================================
    // ACTION: NEEDS_REVIEW
    // ==========================================
    if (action === 'NEEDS_REVIEW') {
      await updateDb((dbState) => {
        const item = dbState.registrations.find((r) => r.id === id);
        if (item) {
          item.status = 'NEEDS_REVIEW';
          if (notes) item.notes = notes;
        }

        if (!dbState.auditLogs) dbState.auditLogs = [];
        dbState.auditLogs.unshift({
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'REGISTRATION_NEEDS_REVIEW',
          targetEntity: 'STUDENT_REGISTRATION',
          targetId: id,
          performedBy: session.name || session.email || 'Admin',
          details: { studentName: reg.studentName, notes },
          timestamp: new Date().toISOString(),
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Registration flagged as Needs Review.',
      });
    }

    // ==========================================
    // ACTION: MARK_PENDING
    // ==========================================
    if (action === 'MARK_PENDING') {
      await updateDb((dbState) => {
        const item = dbState.registrations.find((r) => r.id === id);
        if (item) item.status = 'PENDING';
      });

      return NextResponse.json({
        success: true,
        message: 'Registration reverted to Pending status.',
      });
    }

    return NextResponse.json({ error: 'Unrecognized action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Registration action error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update registration' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400, headers: noCacheHeaders });

  const db = await getDb();
  const reg = (db.registrations || []).find((r) => r.id === id);

  await updateDb((dbState) => {
    dbState.registrations = (dbState.registrations || []).filter((r) => r.id !== id);

    if (reg) {
      // Safe user removal: match exact assignedEmail or exact studentId, NEVER delete by shared parent phone!
      dbState.users = (dbState.users || []).filter(
        (u) =>
          u.role !== 'STUDENT' ||
          (reg.studentId
            ? u.studentDetails?.studentId !== reg.studentId
            : reg.assignedEmail
            ? u.email.toLowerCase() !== reg.assignedEmail.toLowerCase()
            : u.name.toLowerCase() !== reg.studentName.toLowerCase())
      );

      if (!dbState.auditLogs) dbState.auditLogs = [];
      dbState.auditLogs.unshift({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'REGISTRATION_DELETED',
        targetEntity: 'STUDENT_REGISTRATION',
        targetId: id,
        performedBy: session.name || session.email || 'Admin',
        details: {
          studentName: reg.studentName,
          registrationId: reg.registrationId,
          studentId: reg.studentId,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  return NextResponse.json({ success: true }, { headers: noCacheHeaders });
}
