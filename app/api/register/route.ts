import { NextRequest, NextResponse } from 'next/server';
import { getDb, updateDb, generateRegistrationId } from '@/lib/db';
import { StudentRegistration, DuplicateMatchInfo } from '@/lib/db/types';
import { normalizePhone, normalizeEmail, normalizeStudentName } from '@/lib/family/normalization';
import { triggerAutomationEvent } from '@/lib/automation/engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentName,
      classGrade,
      section,
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
    const cleanStudentName = String(studentName).trim();
    const normStudentName = normalizeStudentName(cleanStudentName);

    // 1. Atomically generate guaranteed-unique Registration ID (REG-2026-XXXX)
    const officialRegId = await generateRegistrationId();
    const internalId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 2. Inspect existing database for matching records (Duplicate warning detection)
    // NOTE: Duplicate contacts NEVER block registration!
    const currentDb = await getDb(true);
    const duplicateMatches: DuplicateMatchInfo[] = [];

    // Check existing enrolled student accounts
    for (const user of currentDb.users || []) {
      if (user.role === 'STUDENT') {
        const uPhone = normalizePhone(user.phone || user.studentDetails?.parentPhone);
        const uEmail = normalizeEmail(user.email || user.studentDetails?.parentEmail);
        const uName = normalizeStudentName(user.name);

        const matchedFields: ('PHONE' | 'EMAIL' | 'NAME')[] = [];
        if (cleanPhone && uPhone === cleanPhone) matchedFields.push('PHONE');
        if (cleanEmail && uEmail && uEmail === cleanEmail) matchedFields.push('EMAIL');
        if (normStudentName && uName === normStudentName) matchedFields.push('NAME');

        if (matchedFields.length > 0) {
          duplicateMatches.push({
            matchedRecordId: user.id,
            type: 'STUDENT',
            studentName: user.name,
            studentId: user.studentDetails?.studentId || user.studentDetails?.studentCode,
            guardianPhone: user.phone || user.studentDetails?.parentPhone || '',
            guardianEmail: user.email || user.studentDetails?.parentEmail,
            matchedFields,
            matchDescription: `Matches existing student (${user.name}, ID: ${user.studentDetails?.studentId || 'Enrolled'}) on ${matchedFields.join(', ')}`,
          });
        }
      }
    }

    // Check existing pending/reviewed registrations
    for (const existingReg of currentDb.registrations || []) {
      const rPhone = normalizePhone(existingReg.mobileNumber);
      const rEmail = normalizeEmail(existingReg.email);
      const rName = normalizeStudentName(existingReg.studentName);

      const matchedFields: ('PHONE' | 'EMAIL' | 'NAME')[] = [];
      if (cleanPhone && rPhone === cleanPhone) matchedFields.push('PHONE');
      if (cleanEmail && rEmail && rEmail === cleanEmail) matchedFields.push('EMAIL');
      if (normStudentName && rName === normStudentName) matchedFields.push('NAME');

      if (matchedFields.length > 0) {
        duplicateMatches.push({
          matchedRecordId: existingReg.id,
          type: 'REGISTRATION',
          studentName: existingReg.studentName,
          registrationId: existingReg.registrationId,
          studentId: existingReg.studentId,
          guardianPhone: existingReg.mobileNumber,
          guardianEmail: existingReg.email,
          matchedFields,
          matchDescription: `Matches prior application (${existingReg.studentName}, Ref: ${existingReg.registrationId || existingReg.id}) on ${matchedFields.join(', ')}`,
        });
      }
    }

    const newRegistration: StudentRegistration = {
      id: internalId,
      registrationId: officialRegId,
      studentName: cleanStudentName,
      classGrade: String(classGrade).trim(),
      section: section ? String(section).trim() : 'A',
      schoolName: String(schoolName).trim(),
      parentName: String(parentName).trim(),
      mobileNumber: cleanPhone,
      email: cleanEmail || undefined,
      location: String(location).trim(),
      status: 'PENDING',
      duplicateMatches: duplicateMatches.length > 0 ? duplicateMatches : undefined,
      duplicateStatus: duplicateMatches.length > 0 ? 'POSSIBLE_DUPLICATE' : 'NONE',
      duplicateConfidence: duplicateMatches.length > 0 ? 85 : 0,
      createdAt: new Date().toISOString(),
    };

    // 3. Save to database
    await updateDb((db) => {
      if (!db.registrations) db.registrations = [];
      db.registrations.unshift(newRegistration);
    });

    // 4. Trigger automated background notification
    const origin = req.nextUrl?.origin || 'https://pragathi-ai-education.vercel.app';
    triggerAutomationEvent({
      event: 'REGISTRATION_SUBMITTED',
      studentName: newRegistration.studentName,
      registrationId: newRegistration.registrationId,
      recipientMobile: cleanPhone,
      recipientEmail: cleanEmail || undefined,
      performedBy: 'STUDENT_PORTAL',
      metadata: {
        classGrade: newRegistration.classGrade,
        section: newRegistration.section,
        parentName: newRegistration.parentName,
        origin,
      },
    }).catch((err) => console.warn('Automation error on registration submit:', err));

    return NextResponse.json({
      success: true,
      registrationId: newRegistration.registrationId,
      internalId: newRegistration.id,
      studentName: newRegistration.studentName,
      status: 'PENDING',
      hasDuplicateMatches: duplicateMatches.length > 0,
      message: `Registration successfully submitted! Your official Registration ID is ${newRegistration.registrationId}. Your application is queued for administrative review.`,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving your registration.' },
      { status: 500 }
    );
  }
}
