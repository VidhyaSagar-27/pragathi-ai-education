import { NextRequest, NextResponse } from 'next/server';
import { getDb, noCacheHeaders } from '@/lib/db';
import { normalizePhone, normalizeEmail } from '@/lib/family/normalization';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawIdentifier =
      searchParams.get('identifier') ||
      searchParams.get('mobile') ||
      searchParams.get('id') ||
      searchParams.get('email') ||
      '';

    const identifier = rawIdentifier.trim();
    if (!identifier) {
      return NextResponse.json(
        { error: 'Please provide a 10-digit mobile number, email, or application ID.' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const db = await getDb();
    const cleanPhone = normalizePhone(identifier);
    const cleanEmail = normalizeEmail(identifier);
    const lowerIdentifier = identifier.toLowerCase();

    // Map to collect all student records belonging to this lookup or its Family
    const childrenMap = new Map<string, any>();

    // Helper to add or update student presentation
    const addStudentItem = (item: any) => {
      const key = (item.loginEmail || item.id || item.name).toLowerCase();
      if (!childrenMap.has(key)) {
        childrenMap.set(key, item);
      } else {
        // Merge with preference to APPROVED status
        const existing = childrenMap.get(key);
        if (existing.status !== 'APPROVED' && item.status === 'APPROVED') {
          childrenMap.set(key, item);
        }
      }
    };

    let matchedFamilyId: string | undefined;

    // 1. Check all registrations
    for (const reg of db.registrations || []) {
      const rPhone = normalizePhone(reg.mobileNumber);
      const rEmail = normalizeEmail(reg.email);
      const rId = reg.id.toLowerCase();
      const rAssigned = normalizeEmail(reg.assignedEmail);

      const matches =
        (cleanPhone && rPhone === cleanPhone) ||
        (cleanEmail && (rEmail === cleanEmail || rAssigned === cleanEmail)) ||
        rId === lowerIdentifier;

      if (matches) {
        if (reg.familyId) matchedFamilyId = reg.familyId;

        // Find linked user if approved
        const linkedUser = (db.users || []).find(
          (u) =>
            u.role === 'STUDENT' &&
            ((reg.assignedEmail && u.email.toLowerCase() === reg.assignedEmail.toLowerCase()) ||
              (reg.email && u.email.toLowerCase() === reg.email.toLowerCase()) ||
              u.name.toLowerCase() === reg.studentName.toLowerCase())
        );

        const loginEmail =
          reg.assignedEmail ||
          linkedUser?.email ||
          `${reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pragathiai.student`;
        const temporaryPassword = reg.temporaryPassword || 'Pragathi2026!';

        addStudentItem({
          id: reg.id,
          studentCode: reg.studentCode || 'STU',
          name: reg.studentName,
          status: reg.status,
          mobileNumber: reg.mobileNumber,
          schoolName: reg.schoolName,
          classGrade: reg.classGrade,
          location: reg.location,
          photoUrl: reg.photoUrl,
          loginEmail,
          temporaryPassword,
          createdAt: reg.createdAt,
          approvedAt: reg.approvedAt || (reg.status === 'APPROVED' ? reg.createdAt : undefined),
          notes: reg.notes,
          familyId: reg.familyId,
        });
      }
    }

    // 2. Check all enrolled users in db.users
    for (const user of db.users || []) {
      if (user.role === 'STUDENT') {
        const uPhone = normalizePhone(user.studentDetails?.parentPhone || user.phone);
        const uEmail = normalizeEmail(user.studentDetails?.parentEmail || user.email);
        const uId = user.id.toLowerCase();

        const matches =
          (cleanPhone && uPhone === cleanPhone) ||
          (cleanEmail && uEmail === cleanEmail) ||
          uId === lowerIdentifier;

        if (matches) {
          if (user.studentDetails?.familyId) matchedFamilyId = user.studentDetails.familyId;

          addStudentItem({
            id: user.id,
            studentCode: user.studentDetails?.studentCode || 'STU',
            name: user.name,
            status: user.status === 'ACTIVE' ? 'APPROVED' : 'INACTIVE',
            mobileNumber: user.phone || user.studentDetails?.parentPhone || '',
            schoolName: user.studentDetails?.schoolName || 'PRAGATHI AI School',
            classGrade: user.studentDetails?.classGrade || '10',
            location: user.studentDetails?.location || '',
            photoUrl: user.studentDetails?.photoUrl,
            loginEmail: user.email,
            temporaryPassword: 'Pragathi2026!',
            createdAt: user.createdAt,
            approvedAt: user.createdAt,
            familyId: user.studentDetails?.familyId,
          });
        }
      }
    }

    // 3. If matched with a Family, bring in all other siblings in this family
    if (matchedFamilyId) {
      const family = (db.families || []).find((f) => f.id === matchedFamilyId);
      if (family) {
        // Collect registrations in family
        for (const reg of db.registrations || []) {
          if (reg.familyId === matchedFamilyId) {
            const loginEmail =
              reg.assignedEmail ||
              `${reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pragathiai.student`;
            addStudentItem({
              id: reg.id,
              studentCode: reg.studentCode || 'STU',
              name: reg.studentName,
              status: reg.status,
              mobileNumber: reg.mobileNumber,
              schoolName: reg.schoolName,
              classGrade: reg.classGrade,
              location: reg.location,
              photoUrl: reg.photoUrl,
              loginEmail,
              temporaryPassword: reg.temporaryPassword || 'Pragathi2026!',
              createdAt: reg.createdAt,
              approvedAt: reg.approvedAt,
              notes: reg.notes,
              familyId: reg.familyId,
            });
          }
        }

        // Collect users in family
        for (const user of db.users || []) {
          if (user.role === 'STUDENT' && user.studentDetails?.familyId === matchedFamilyId) {
            addStudentItem({
              id: user.id,
              studentCode: user.studentDetails?.studentCode || 'STU',
              name: user.name,
              status: user.status === 'ACTIVE' ? 'APPROVED' : 'INACTIVE',
              mobileNumber: user.phone || user.studentDetails?.parentPhone || '',
              schoolName: user.studentDetails?.schoolName || 'PRAGATHI AI School',
              classGrade: user.studentDetails?.classGrade || '10',
              location: user.studentDetails?.location || '',
              photoUrl: user.studentDetails?.photoUrl,
              loginEmail: user.email,
              temporaryPassword: 'Pragathi2026!',
              createdAt: user.createdAt,
              approvedAt: user.createdAt,
              familyId: user.studentDetails?.familyId,
            });
          }
        }
      }
    }

    const familyStudents = Array.from(childrenMap.values());

    if (familyStudents.length === 0) {
      return NextResponse.json(
        {
          found: false,
          error: `No student application or account found for '${identifier}'. Please ensure you entered the correct 10-digit mobile number or register as a new student.`,
        },
        { status: 404, headers: noCacheHeaders }
      );
    }

    // Sort by status: APPROVED first, then PENDING, then others
    familyStudents.sort((a, b) => {
      if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
      if (b.status === 'APPROVED' && a.status !== 'APPROVED') return 1;
      return 0;
    });

    const primaryStudent = familyStudents[0];

    return NextResponse.json(
      {
        found: true,
        status: primaryStudent.status,
        student: primaryStudent,
        familyStudents,
        totalChildren: familyStudents.length,
        familyId: matchedFamilyId,
        message:
          primaryStudent.status === 'PENDING'
            ? 'Your registration application is under review by PRAGATHI AI administrators. Once accepted, your login credentials will be displayed here immediately and sent via WhatsApp/SMS.'
            : undefined,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Application status lookup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during status verification.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
