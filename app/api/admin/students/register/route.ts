import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import {
  getDb,
  updateDb,
  generateNextRollNumber,
  peekNextRollNumber,
  generateRegistrationId,
  noCacheHeaders,
} from '@/lib/db';
import { User, StudentRegistration } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Peek at the next auto-generated roll number for the UI preview
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  try {
    const nextRollNumber = await peekNextRollNumber();
    return NextResponse.json({ nextRollNumber }, { headers: noCacheHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to peek roll number' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

// POST: Register a new student with auto-incrementing roll number and phone initial password
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      schoolName,
      classGrade,
      section = 'A',
      parentName = '',
      phone,
      email,
      photoData,
      location = '',
      group = 'Foundation Batch A',
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
    const cleanSection = section ? String(section).trim().toUpperCase() : 'A';
    const cleanParent = parentName ? String(parentName).trim() : 'Parent / Guardian';
    const cleanLocation = location ? String(location).trim() : cleanSchool;

    // 1. Atomically generate the next sequential roll number (PRG001, PRG002, etc.)
    const rollNumber = await generateNextRollNumber();

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
        section: cleanSection,
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
      studentName: cleanName,
      classGrade: cleanClass,
      section: cleanSection,
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

    return NextResponse.json({
      success: true,
      message: `Student registered successfully with Roll Number ${rollNumber}!`,
      credentials: {
        loginId: rollNumber,
        rollNumber,
        initialPassword: cleanPhone,
      },
      student: {
        id: newStudentUser.id,
        name: newStudentUser.name,
        rollNumber: newStudentUser.rollNumber,
        phone: newStudentUser.phone,
        email: newStudentUser.email,
        schoolName: cleanSchool,
        classGrade: cleanClass,
        section: cleanSection,
        photoUrl: newStudentUser.studentDetails?.photoUrl,
      },
    });
  } catch (error: any) {
    console.error('Fast student registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to register student' },
      { status: 500 }
    );
  }
}
