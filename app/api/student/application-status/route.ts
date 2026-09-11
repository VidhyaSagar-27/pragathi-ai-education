import { NextRequest, NextResponse } from 'next/server';
import { getDb, noCacheHeaders } from '@/lib/db';

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
    const cleanDigits = identifier.replace(/\D/g, '');
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : '';
    const lowerIdentifier = identifier.toLowerCase();

    // 1. Check in db.registrations
    const registrations = db.registrations || [];
    const reg = registrations.find((r) => {
      if (r.id && r.id.toLowerCase() === lowerIdentifier) return true;
      if (r.email && r.email.toLowerCase() === lowerIdentifier) return true;
      if (r.assignedEmail && r.assignedEmail.toLowerCase() === lowerIdentifier) return true;
      if (last10 && r.mobileNumber) {
        const rDigits = r.mobileNumber.replace(/\D/g, '');
        if (rDigits.slice(-10) === last10) return true;
      }
      return false;
    });

    if (reg) {
      if (reg.status === 'APPROVED') {
        // Find corresponding user account in db.users for certainty
        const user = (db.users || []).find(
          (u) =>
            u.role === 'STUDENT' &&
            ((reg.assignedEmail && u.email.toLowerCase() === reg.assignedEmail.toLowerCase()) ||
             (reg.email && u.email.toLowerCase() === reg.email.toLowerCase()) ||
             (last10 && u.phone && u.phone.replace(/\D/g, '').slice(-10) === last10) ||
             u.name.toLowerCase() === reg.studentName.toLowerCase())
        );

        const loginEmail = reg.assignedEmail || user?.email || `${reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pragathiai.student`;
        const temporaryPassword = reg.temporaryPassword || 'Pragathi2026!';

        return NextResponse.json(
          {
            found: true,
            status: 'APPROVED',
            student: {
              id: reg.id,
              name: reg.studentName,
              mobileNumber: reg.mobileNumber,
              schoolName: reg.schoolName,
              classGrade: reg.classGrade,
              location: reg.location,
              photoUrl: reg.photoUrl,
              loginEmail,
              temporaryPassword,
              approvedAt: reg.approvedAt || reg.createdAt,
            },
          },
          { headers: noCacheHeaders }
        );
      }

      if (reg.status === 'PENDING') {
        return NextResponse.json(
          {
            found: true,
            status: 'PENDING',
            student: {
              id: reg.id,
              name: reg.studentName,
              mobileNumber: reg.mobileNumber,
              schoolName: reg.schoolName,
              classGrade: reg.classGrade,
              createdAt: reg.createdAt,
            },
            message:
              'Your registration application is under review by PRAGATHI AI administrators. Once accepted, your login credentials will be displayed here immediately and sent via WhatsApp/SMS.',
          },
          { headers: noCacheHeaders }
        );
      }

      if (reg.status === 'REJECTED') {
        return NextResponse.json(
          {
            found: true,
            status: 'REJECTED',
            student: {
              id: reg.id,
              name: reg.studentName,
              mobileNumber: reg.mobileNumber,
            },
            notes:
              reg.notes ||
              'Your registration application could not be approved at this time. Please contact your school administrator or submit a new registration with valid information.',
          },
          { headers: noCacheHeaders }
        );
      }
    }

    // 2. Check in db.users for directly enrolled students
    const studentUser = (db.users || []).find((u) => {
      if (u.role !== 'STUDENT') return false;
      if (u.email.toLowerCase() === lowerIdentifier) return true;
      if (last10 && u.phone) {
        const uDigits = u.phone.replace(/\D/g, '');
        if (uDigits.slice(-10) === last10) return true;
      }
      return false;
    });

    if (studentUser) {
      return NextResponse.json(
        {
          found: true,
          status: studentUser.status === 'ACTIVE' ? 'APPROVED' : 'INACTIVE',
          student: {
            id: studentUser.id,
            name: studentUser.name,
            mobileNumber: studentUser.phone || '',
            schoolName: studentUser.studentDetails?.schoolName || 'PRAGATHI AI School',
            classGrade: studentUser.studentDetails?.classGrade || '10',
            location: studentUser.studentDetails?.location || '',
            photoUrl: studentUser.studentDetails?.photoUrl,
            loginEmail: studentUser.email,
            temporaryPassword: 'Pragathi2026!',
            approvedAt: studentUser.createdAt,
          },
        },
        { headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      {
        found: false,
        error: `No student application or active account found for '${identifier}'. Please ensure you entered the correct 10-digit mobile number or register as a new student.`,
      },
      { status: 404, headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Application status lookup error:', error);
    return NextResponse.json(
      { error: 'An error occurred while looking up application status.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.identifier || body.mobile || body.email || '';
    const fakeUrl = new URL(`http://localhost/api/student/application-status?identifier=${encodeURIComponent(identifier)}`);
    const newReq = new NextRequest(fakeUrl);
    return GET(newReq);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: noCacheHeaders });
  }
}
