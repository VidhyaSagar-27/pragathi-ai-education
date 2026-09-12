import { NextRequest, NextResponse } from 'next/server';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { normalizePhone, normalizeEmail } from '@/lib/family/normalization';
import { evaluateDuplicateRisk } from '@/lib/family/duplicateEngine';
import { StudentRegistration } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get('identifier') || searchParams.get('phone') || searchParams.get('familyId') || '';

    if (!identifier) {
      return NextResponse.json(
        { error: 'Please provide parent phone number, email, or Family ID.' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const db = await getDb(true);
    const cleanPhone = normalizePhone(identifier);
    const cleanEmail = normalizeEmail(identifier);
    const rawId = identifier.trim().toLowerCase();

    // Find family
    const family = (db.families || []).find((f) => {
      if (f.id.toLowerCase() === rawId) return true;
      if (cleanPhone && f.parentPhones?.some((p) => normalizePhone(p) === cleanPhone)) return true;
      if (cleanEmail && f.parentEmails?.some((e) => normalizeEmail(e) === cleanEmail)) return true;
      return false;
    });

    if (!family) {
      return NextResponse.json(
        { error: `No family account found for '${identifier}'. Please check the details or register your first child.` },
        { status: 404, headers: noCacheHeaders }
      );
    }

    // Collect all children in this family
    const childrenMap = new Map<string, any>();

    // 1. Enrolled students in db.users
    for (const user of db.users || []) {
      if (user.role === 'STUDENT' && user.studentDetails?.familyId === family.id) {
        childrenMap.set(user.id, {
          id: user.id,
          studentCode: user.studentDetails?.studentCode || 'STU',
          name: user.name,
          status: user.status === 'ACTIVE' ? 'APPROVED' : 'INACTIVE',
          classGrade: user.studentDetails?.classGrade || '10',
          schoolName: user.studentDetails?.schoolName || 'PRAGATHI AI Academy',
          location: user.studentDetails?.location || '',
          loginEmail: user.email,
          temporaryPassword: 'Pragathi2026!',
          createdAt: user.createdAt,
          type: 'ENROLLED',
        });
      }
    }

    // 2. Registrations in db.registrations
    for (const reg of db.registrations || []) {
      if (reg.familyId === family.id) {
        const key = reg.id;
        const loginEmail =
          reg.assignedEmail ||
          `${reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pragathiai.student`;

        childrenMap.set(key, {
          id: reg.id,
          studentCode: reg.studentCode || 'STU',
          name: reg.studentName,
          status: reg.status,
          classGrade: reg.classGrade,
          schoolName: reg.schoolName,
          location: reg.location,
          loginEmail,
          temporaryPassword: reg.temporaryPassword || 'Pragathi2026!',
          createdAt: reg.createdAt,
          duplicateStatus: reg.duplicateStatus || 'NONE',
          type: 'REGISTRATION',
        });
      }
    }

    const children = Array.from(childrenMap.values());

    return NextResponse.json(
      {
        family: {
          id: family.id,
          familyName: family.familyName,
          parentName: family.parentName,
          parentPhones: family.parentPhones,
          parentEmails: family.parentEmails,
          createdAt: family.createdAt,
        },
        children,
        totalChildren: children.length,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Parent children fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family children records.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyId, studentName, classGrade, schoolName, location } = body;

    if (!familyId || !studentName || !classGrade || !schoolName || !location) {
      return NextResponse.json(
        { error: 'Please provide all required child information (Name, Grade, School, Location).' },
        { status: 400 }
      );
    }

    const currentDb = await getDb(true);
    const family = (currentDb.families || []).find((f) => f.id === familyId);

    if (!family) {
      return NextResponse.json(
        { error: 'Family account not found. Please verify family details.' },
        { status: 404 }
      );
    }

    const primaryPhone = family.parentPhones?.[0] || '1234567899';
    const primaryEmail = family.parentEmails?.[0];

    // Evaluate duplicate risk within this family
    const dupResult = evaluateDuplicateRisk(
      {
        studentName: String(studentName).trim(),
        classGrade: String(classGrade).trim(),
        schoolName: String(schoolName).trim(),
        parentName: family.parentName,
        mobileNumber: primaryPhone,
        email: primaryEmail,
        location: String(location).trim(),
      },
      currentDb
    );

    if (dupResult.classification === 'VERY_LIKELY_DUPLICATE') {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        message: 'This child already has an active application under this family account.',
        existingRecord: dupResult.matchedRecord,
      });
    }

    const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const totalStudents =
      (currentDb.users?.filter((u) => u.role === 'STUDENT').length || 0) +
      (currentDb.registrations?.length || 0) + 1;
    const studentCode = `STU${totalStudents.toString().padStart(3, '0')}`;
    const isPossibleDuplicate = dupResult.classification === 'POSSIBLE_DUPLICATE';

    const newRegistration: StudentRegistration = {
      id: regId,
      studentName: String(studentName).trim(),
      classGrade: String(classGrade).trim(),
      schoolName: String(schoolName).trim(),
      parentName: family.parentName,
      mobileNumber: primaryPhone,
      email: primaryEmail,
      location: String(location).trim(),
      status: 'PENDING',
      familyId: family.id,
      studentCode,
      duplicateStatus: isPossibleDuplicate ? 'POSSIBLE_DUPLICATE' : 'NONE',
      duplicateConfidence: isPossibleDuplicate ? dupResult.confidence : 0,
      flaggedMatchId: isPossibleDuplicate ? dupResult.matchedRecord?.id : undefined,
      matchSignals: isPossibleDuplicate ? dupResult.matchSignals : undefined,
      createdAt: new Date().toISOString(),
    };

    await updateDb((db) => {
      const targetFamily = (db.families || []).find((f) => f.id === familyId);
      if (targetFamily && !targetFamily.registrationIds.includes(newRegistration.id)) {
        targetFamily.registrationIds.push(newRegistration.id);
        targetFamily.updatedAt = new Date().toISOString();
      }

      if (isPossibleDuplicate) {
        if (!db.duplicateLogs) db.duplicateLogs = [];
        db.duplicateLogs.unshift({
          id: `dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          studentName: newRegistration.studentName,
          parentPhone: primaryPhone,
          parentEmail: primaryEmail,
          submittedAt: new Date().toISOString(),
          reason: `Sibling application flagged for review (${dupResult.confidence}% confidence)`,
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
      message: 'New child successfully registered and linked to your family account!',
      registration: newRegistration,
    });
  } catch (error) {
    console.error('Add child error:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding child to family.' },
      { status: 500 }
    );
  }
}
