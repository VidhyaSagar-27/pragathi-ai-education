import { NextRequest, NextResponse } from 'next/server';
import { getDb, updateDb } from '@/lib/db';
import { StudentRegistration, DuplicateAttemptLog } from '@/lib/db/types';
import { normalizePhone, normalizeEmail } from '@/lib/family/normalization';
import {
  evaluateDuplicateRisk,
  getOrCreateTransitiveFamily,
} from '@/lib/family/duplicateEngine';

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
      familyId: requestedFamilyId,
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

    // 1. Fetch current database state to evaluate duplicate risk
    const currentDb = await getDb(true);

    const dupResult = evaluateDuplicateRisk(
      {
        studentName: String(studentName).trim(),
        classGrade: String(classGrade).trim(),
        schoolName: String(schoolName).trim(),
        parentName: String(parentName).trim(),
        mobileNumber: cleanPhone,
        email: cleanEmail || undefined,
        location: String(location).trim(),
      },
      currentDb
    );

    // BRANCH 1: VERY LIKELY DUPLICATE (>= 95% Confidence)
    // Rahul submits multiple times -> Do NOT create duplicate student/registration.
    if (dupResult.classification === 'VERY_LIKELY_DUPLICATE') {
      const logEntry: DuplicateAttemptLog = {
        id: `dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentName: String(studentName).trim(),
        existingStudentId:
          dupResult.matchedRecord?.type === 'USER' ? dupResult.matchedRecord.id : undefined,
        existingRegistrationId:
          dupResult.matchedRecord?.type === 'REGISTRATION'
            ? dupResult.matchedRecord.id
            : undefined,
        parentPhone: cleanPhone,
        parentEmail: cleanEmail || undefined,
        submittedAt: new Date().toISOString(),
        reason: `Very likely duplicate submission (${dupResult.confidence}% confidence)`,
        confidence: dupResult.confidence,
        matchSignals: dupResult.matchSignals,
        rawPayload: body,
        status: 'BLOCKED',
      };

      await updateDb((db) => {
        if (!db.duplicateLogs) db.duplicateLogs = [];
        db.duplicateLogs.unshift(logEntry);
      });

      return NextResponse.json({
        success: true,
        isDuplicate: true,
        duplicateStatus: 'VERY_LIKELY_DUPLICATE',
        confidence: dupResult.confidence,
        message:
          'This student already has an active enrollment application on file. You do not need to register again. You can check your application approval status and credentials at any time.',
        existingApplicationId: dupResult.matchedRecord?.id,
        existingRecord: dupResult.matchedRecord,
        matchSignals: dupResult.matchSignals,
      });
    }

    // Prepare Registration Object
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isPossibleDuplicate = dupResult.classification === 'POSSIBLE_DUPLICATE';

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
      duplicateStatus: isPossibleDuplicate ? 'POSSIBLE_DUPLICATE' : 'NONE',
      duplicateConfidence: isPossibleDuplicate ? dupResult.confidence : 0,
      flaggedMatchId: isPossibleDuplicate ? dupResult.matchedRecord?.id : undefined,
      matchSignals: isPossibleDuplicate ? dupResult.matchSignals : undefined,
      createdAt: new Date().toISOString(),
    };

    // Save registration, associate Family, and log if flagged
    await updateDb((db) => {
      // Find or assign Family (Transitive matching)
      let family = requestedFamilyId
        ? (db.families || []).find((f) => f.id === requestedFamilyId)
        : undefined;

      if (!family) {
        family = getOrCreateTransitiveFamily(db, {
          parentName: newRegistration.parentName,
          parentPhone: newRegistration.mobileNumber,
          parentEmail: newRegistration.email,
          registrationId: newRegistration.id,
        });
      }

      newRegistration.familyId = family.id;
      if (!family.registrationIds.includes(newRegistration.id)) {
        family.registrationIds.push(newRegistration.id);
      }

      // Generate sequential student code for this family member
      const totalStudents = (db.users?.filter((u) => u.role === 'STUDENT').length || 0) +
        (db.registrations?.length || 0) + 1;
      newRegistration.studentCode = `STU${totalStudents.toString().padStart(3, '0')}`;

      // If possible duplicate, record in audit logs
      if (isPossibleDuplicate) {
        if (!db.duplicateLogs) db.duplicateLogs = [];
        db.duplicateLogs.unshift({
          id: `dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          studentName: newRegistration.studentName,
          existingStudentId:
            dupResult.matchedRecord?.type === 'USER' ? dupResult.matchedRecord.id : undefined,
          existingRegistrationId:
            dupResult.matchedRecord?.type === 'REGISTRATION'
              ? dupResult.matchedRecord.id
              : undefined,
          parentPhone: cleanPhone,
          parentEmail: cleanEmail || undefined,
          submittedAt: new Date().toISOString(),
          reason: `Possible duplicate flagged for admin review (${dupResult.confidence}% confidence)`,
          confidence: dupResult.confidence,
          matchSignals: dupResult.matchSignals,
          rawPayload: body,
          status: 'FLAGGED_FOR_REVIEW',
        });
      }

      db.registrations.unshift(newRegistration);
    });

    return NextResponse.json({
      success: true,
      isDuplicate: false,
      duplicateStatus: newRegistration.duplicateStatus,
      confidence: dupResult.confidence,
      familyId: newRegistration.familyId,
      studentCode: newRegistration.studentCode,
      message: isPossibleDuplicate
        ? 'Application received and submitted for administrative verification.'
        : 'Registration successfully submitted! Your application has been sent to PRAGATHI AI administrators for review.',
      registrationId: newRegistration.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving your registration.' },
      { status: 500 }
    );
  }
}
