import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { normalizePhone, normalizeEmail } from '@/lib/family/normalization';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const db = await getDb(true);
  const families = db.families || [];
  const registrations = db.registrations || [];
  const users = db.users || [];
  const duplicateLogs = db.duplicateLogs || [];

  // 1. Enriched Families with complete children records
  const enrichedFamilies = families.map((fam) => {
    // Find all enrolled students
    const enrolledChildren = users
      .filter((u) => u.role === 'STUDENT' && u.studentDetails?.familyId === fam.id)
      .map((u) => ({
        id: u.id,
        type: 'ENROLLED' as const,
        name: u.name,
        email: u.email,
        phone: u.phone || u.studentDetails?.parentPhone,
        classGrade: u.studentDetails?.classGrade,
        schoolName: u.studentDetails?.schoolName,
        studentCode: u.studentDetails?.studentCode || 'STU',
        status: u.status,
        createdAt: u.createdAt,
      }));

    // Find all pending/approved registrations belonging to this family
    const registrationChildren = registrations
      .filter((r) => r.familyId === fam.id)
      .map((r) => ({
        id: r.id,
        type: 'REGISTRATION' as const,
        name: r.studentName,
        email: r.email || r.assignedEmail,
        phone: r.mobileNumber,
        classGrade: r.classGrade,
        schoolName: r.schoolName,
        studentCode: r.studentCode || 'STU',
        status: r.status,
        duplicateStatus: r.duplicateStatus || 'NONE',
        duplicateConfidence: r.duplicateConfidence,
        createdAt: r.createdAt,
      }));

    return {
      ...fam,
      enrolledChildren,
      registrationChildren,
      totalChildren: enrolledChildren.length + registrationChildren.length,
    };
  });

  // 2. Possible Duplicates requiring Admin Review
  const possibleDuplicates = registrations
    .filter((r) => r.duplicateStatus === 'POSSIBLE_DUPLICATE')
    .map((candidate) => {
      // Find flagged match record
      let matchedRecord: any = null;
      if (candidate.flaggedMatchId) {
        const foundReg = registrations.find((r) => r.id === candidate.flaggedMatchId);
        if (foundReg) {
          matchedRecord = {
            id: foundReg.id,
            type: 'REGISTRATION',
            name: foundReg.studentName,
            classGrade: foundReg.classGrade,
            schoolName: foundReg.schoolName,
            parentName: foundReg.parentName,
            parentPhone: foundReg.mobileNumber,
            parentEmail: foundReg.email,
            status: foundReg.status,
            createdAt: foundReg.createdAt,
          };
        } else {
          const foundUser = users.find((u) => u.id === candidate.flaggedMatchId);
          if (foundUser) {
            matchedRecord = {
              id: foundUser.id,
              type: 'USER',
              name: foundUser.name,
              classGrade: foundUser.studentDetails?.classGrade,
              schoolName: foundUser.studentDetails?.schoolName,
              parentName: foundUser.studentDetails?.parentName,
              parentPhone: foundUser.studentDetails?.parentPhone || foundUser.phone,
              parentEmail: foundUser.studentDetails?.parentEmail || foundUser.email,
              status: foundUser.status,
              createdAt: foundUser.createdAt,
            };
          }
        }
      }

      return {
        candidate,
        matchedRecord,
        confidence: candidate.duplicateConfidence || 85,
        matchSignals: candidate.matchSignals || ['Same Parent Contact & Similar Name'],
      };
    });

  // 3. Confirmed Duplicates
  const confirmedDuplicates = registrations.filter(
    (r) => r.duplicateStatus === 'CONFIRMED_DUPLICATE'
  );

  return NextResponse.json(
    {
      families: enrichedFamilies,
      possibleDuplicates,
      confirmedDuplicates,
      duplicateLogs,
      stats: {
        totalFamilies: enrichedFamilies.length,
        totalPossibleDuplicates: possibleDuplicates.length,
        totalConfirmedDuplicates: confirmedDuplicates.length,
        totalAuditLogs: duplicateLogs.length,
      },
    },
    { headers: noCacheHeaders }
  );
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  try {
    const body = await req.json();
    const { action, registrationId, familyId, targetFamilyId, parentName, parentPhones, parentEmails } =
      body;

    if (action === 'CONFIRM_DUPLICATE') {
      if (!registrationId) {
        return NextResponse.json({ error: 'registrationId is required' }, { status: 400 });
      }

      await updateDb((db) => {
        const reg = (db.registrations || []).find((r) => r.id === registrationId);
        if (reg) {
          reg.duplicateStatus = 'CONFIRMED_DUPLICATE';
          reg.status = 'REJECTED';
          reg.notes = 'Application confirmed as duplicate submission by administrator.';
        }

        // Update corresponding audit log
        if (db.duplicateLogs) {
          const log = db.duplicateLogs.find((l) => l.existingRegistrationId === registrationId);
          if (log) log.status = 'RESOLVED';
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Application marked as Confirmed Duplicate and closed.',
      });
    }

    if (action === 'KEEP_SEPARATE') {
      if (!registrationId) {
        return NextResponse.json({ error: 'registrationId is required' }, { status: 400 });
      }

      await updateDb((db) => {
        const reg = (db.registrations || []).find((r) => r.id === registrationId);
        if (reg) {
          reg.duplicateStatus = 'NONE';
          reg.duplicateConfidence = 0;
          reg.notes = 'Verified as distinct child / sibling by administrator.';
        }

        if (db.duplicateLogs) {
          const log = db.duplicateLogs.find((l) => l.existingRegistrationId === registrationId);
          if (log) log.status = 'RESOLVED';
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Application confirmed as a separate child and queued for standard approval.',
      });
    }

    if (action === 'MOVE_FAMILY') {
      if (!registrationId || !targetFamilyId) {
        return NextResponse.json(
          { error: 'registrationId and targetFamilyId are required' },
          { status: 400 }
        );
      }

      await updateDb((db) => {
        const reg = (db.registrations || []).find((r) => r.id === registrationId);
        if (reg) {
          // Remove from old family
          if (reg.familyId && db.families) {
            const oldFam = db.families.find((f) => f.id === reg.familyId);
            if (oldFam) {
              oldFam.registrationIds = (oldFam.registrationIds || []).filter(
                (rid) => rid !== registrationId
              );
            }
          }

          // Assign to target family
          reg.familyId = targetFamilyId;
          if (db.families) {
            const targetFam = db.families.find((f) => f.id === targetFamilyId);
            if (targetFam && !targetFam.registrationIds.includes(registrationId)) {
              targetFam.registrationIds.push(registrationId);
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Student application moved to target family successfully.',
      });
    }

    if (action === 'UPDATE_PARENT_CONTACT') {
      if (!familyId) {
        return NextResponse.json({ error: 'familyId is required' }, { status: 400 });
      }

      await updateDb((db) => {
        const fam = (db.families || []).find((f) => f.id === familyId);
        if (fam) {
          if (parentName) {
            fam.parentName = parentName;
            fam.familyName = `${parentName} Family`;
          }
          if (Array.isArray(parentPhones)) {
            fam.parentPhones = parentPhones.map(normalizePhone).filter(Boolean);
          }
          if (Array.isArray(parentEmails)) {
            fam.parentEmails = parentEmails.map(normalizeEmail).filter(Boolean);
          }
          fam.updatedAt = new Date().toISOString();
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Family contact details updated successfully.',
      });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (error) {
    console.error('Family review action error:', error);
    return NextResponse.json(
      { error: 'An error occurred during family review action.' },
      { status: 500 }
    );
  }
}
