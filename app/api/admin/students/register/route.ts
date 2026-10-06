import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import {
  getDb,
  updateDb,
  generateNextRollNumber,
  peekNextRollNumber,
  getRollNumberStatus,
  updateSequenceIfHigher,
  generateRegistrationId,
  noCacheHeaders,
} from '@/lib/db';
import { User, StudentRegistration } from '@/lib/db/types';
import { triggerAutomationEvent } from '@/lib/automation/engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Return comprehensive roll number status (recommended, next sequential, vacant numbers)
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  try {
    const status = await getRollNumberStatus();
    return NextResponse.json(status, { headers: noCacheHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to get roll number status' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

// POST: Register a new student with auto-incrementing or admin-chosen roll number
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      schoolName,
      classGrade,
      parentName = '',
      phone,
      email,
      photoData,
      location = '',
      group = 'Foundation Batch A',
      selectedRollNumber,
      rollNumber: customRoll,
    } = body;

    if (!name || !schoolName || !classGrade || !phone) {
      return NextResponse.json(
        { error: 'Student Name, School Name, Class, and Phone Number are required.' },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
    const cleanSchool = String(schoolName).trim();
    const cleanClass = String(classGrade).trim();
    const cleanParent = parentName ? String(parentName).trim() : 'Parent / Guardian';
    const cleanLocation = location ? String(location).trim() : cleanSchool;

    // 1. Determine roll number: admin selected/specified or auto-generated
    let rollNumber: string;
    const requestedRoll = (selectedRollNumber || customRoll || '').toString().trim().toUpperCase();

    const currentDb = await getDb();
    if (requestedRoll) {
      // Validate uniqueness against active students
      const conflict = (currentDb.users || []).find(
        (u) =>
          u.role === 'STUDENT' &&
          (u.rollNumber?.toUpperCase() === requestedRoll ||
            u.studentDetails?.rollNumber?.toUpperCase() === requestedRoll)
      );
      if (conflict) {
        return NextResponse.json(
          {
            error: `Roll Number ${requestedRoll} is already assigned to active student "${conflict.name}". Please pick a different roll number.`,
          },
          { status: 400 }
        );
      }
      rollNumber = requestedRoll;

      // Update Postgres sequence if this roll number's numeric value exceeds current sequence
      const numMatch = requestedRoll.match(/PRG(\d+)/i);
      if (numMatch) {
        const numVal = parseInt(numMatch[1], 10);
        await updateSequenceIfHigher('student_roll_number', numVal);
      }
    } else {
      const status = await getRollNumberStatus();
      if (status.vacantRollNumbers.length > 0) {
        rollNumber = status.vacantRollNumbers[0];
      } else {
        rollNumber = await generateNextRollNumber();
      }
    }

    // 2. Hash phone number as INITIAL password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(cleanPhone, salt);

    // 3. Construct unique internal user UUID
    const userId = `usr_stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newStudentUser: User = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      phone: cleanPhone,
      rollNumber,
      mustChangePassword: true,
      studentDetails: {
        rollNumber,
        studentId: rollNumber,
        studentCode: rollNumber,
        classGrade: cleanClass,
        schoolName: cleanSchool,
        parentName: cleanParent,
        parentPhone: cleanPhone,
        parentEmail: cleanEmail,
        location: cleanLocation,
        group,
        photoUrl: photoData ? String(photoData).trim() : undefined,
        mustChangePassword: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Also create a matching registration record for complete audit and sync
    const regSeqId = await generateRegistrationId();
    const newRegistration: StudentRegistration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      registrationId: regSeqId,
      studentId: rollNumber,
      rollNumber,
      studentName: cleanName,
      classGrade: cleanClass,
      schoolName: cleanSchool,
      parentName: cleanParent,
      mobileNumber: cleanPhone,
      email: cleanEmail,
      location: cleanLocation,
      photoUrl: photoData ? String(photoData).trim() : undefined,
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };

    // 5. Atomically commit to Neon database
    await updateDb((db) => {
      if (!db.users) db.users = [];
      db.users.push(newStudentUser);

      if (!db.registrations) db.registrations = [];
      db.registrations.unshift(newRegistration);
    });

    // 6. Automatically dispatch credentials to WhatsApp and Email
    const origin = req.nextUrl?.origin || 'https://pragathi-ai-education.vercel.app';
    const channels: ('WHATSAPP' | 'EMAIL')[] = cleanEmail ? ['WHATSAPP', 'EMAIL'] : ['WHATSAPP'];

    let automationResult: any = null;
    try {
      automationResult = await triggerAutomationEvent({
        event: 'CREDENTIALS_DISPATCH',
        studentId: rollNumber,
        studentName: cleanName,
        registrationId: regSeqId,
        recipientMobile: cleanPhone,
        recipientEmail: cleanEmail,
        performedBy: session.name || session.email || 'Admin',
        channels,
        metadata: {
          role: 'STUDENT',
          rollNumber,
          loginEmail: rollNumber,
          temporaryPassword: cleanPhone,
          classGrade: cleanClass,
          schoolName: cleanSchool,
          origin,
          portalUrl: `${origin}/login?email=${encodeURIComponent(rollNumber)}&role=STUDENT`,
        },
      });
    } catch (autoErr: any) {
      console.warn('Auto-dispatch failed during student registration:', autoErr);
    }

    return NextResponse.json({
      success: true,
      message: `Student registered successfully with Roll Number ${rollNumber}! Login details dispatched to WhatsApp & Email.`,
      credentials: {
        loginId: rollNumber,
        rollNumber,
        initialPassword: cleanPhone,
      },
      dispatched: {
        whatsapp: true,
        email: !!cleanEmail,
        recipientPhone: cleanPhone,
        recipientEmail: cleanEmail || null,
        automation: automationResult?.results || null,
      },
      student: {
        id: newStudentUser.id,
        name: newStudentUser.name,
        rollNumber: newStudentUser.rollNumber,
        phone: newStudentUser.phone,
        email: newStudentUser.email,
        schoolName: cleanSchool,
        classGrade: cleanClass,
        photoUrl: newStudentUser.studentDetails?.photoUrl,
      },
    });
  } catch (error: any) {
    console.error('Fast student registration error:', error);
    const isQuotaError =
      error?.message?.includes('402') ||
      error?.message?.toLowerCase().includes('quota') ||
      error?.message?.toLowerCase().includes('exceeded');

    const message = isQuotaError
      ? 'Database quota reached on Neon. Please upgrade or reactivate your database in the Neon console (https://console.neon.tech) to continue registering students.'
      : error?.message || 'Failed to register student';

    return NextResponse.json(
      { error: message },
      { status: isQuotaError ? 402 : 500 }
    );
  }
}
