import { NextRequest, NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';
import { StudentRegistration } from '@/lib/db/types';
import { normalizePhone, normalizeEmail } from '@/lib/family/normalization';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentName,
      classGrade,
      schoolName,
      parentName,
      mobileNumber,
      email,
      location,
    } = body;

    if (!studentName || !classGrade || !schoolName || !parentName || !mobileNumber || !location) {
      return NextResponse.json(
        { error: 'Please fill in all required registration fields.' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(mobileNumber);
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const cleanEmail = normalizeEmail(email);
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newRegistration: StudentRegistration = {
      id: regId,
      studentName: String(studentName).trim(),
      classGrade: String(classGrade).trim(),
      schoolName: String(schoolName).trim(),
      parentName: String(parentName).trim(),
      mobileNumber: cleanPhone,
      email: cleanEmail || undefined,
      location: String(location).trim(),
      status: 'PENDING',
      duplicateStatus: 'NONE',
      duplicateConfidence: 0,
      createdAt: new Date().toISOString(),
    };

    await updateDb((db) => {
      if (!db.registrations) db.registrations = [];

      // Generate sequential student code
      const totalStudents =
        (db.users?.filter((u) => u.role === 'STUDENT').length || 0) +
        db.registrations.length +
        1;
      newRegistration.studentCode = `STU${totalStudents.toString().padStart(3, '0')}`;

      db.registrations.unshift(newRegistration);
    });

    return NextResponse.json({
      success: true,
      isDuplicate: false,
      message:
        'Registration successfully submitted! Your application has been sent to PRAGATHI AI administrators for review.',
      registrationId: newRegistration.id,
      studentCode: newRegistration.studentCode,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving your registration.' },
      { status: 500 }
    );
  }
}
