import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json(
      { error: 'Unauthorized. Only administrators and instructors can update student photos.' },
      { status: 403, headers: noCacheHeaders }
    );
  }

  try {
    const body = await req.json();
    const { studentId, photoUrl } = body;

    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
    }

    if (!photoUrl || typeof photoUrl !== 'string') {
      return NextResponse.json({ error: 'Valid photo data is required.' }, { status: 400 });
    }

    const cleanPhoto = photoUrl.trim();

    let updatedUser: any = null;
    await updateDb((db) => {
      const user = db.users.find((u) => u.id === studentId);
      if (!user) {
        throw new Error('Student account not found.');
      }

      if (!user.studentDetails) {
        user.studentDetails = {
          classGrade: 'N/A',
          schoolName: 'N/A',
          parentName: 'N/A',
          location: 'N/A',
          group: 'Foundation Batch A',
        };
      }

      user.studentDetails.photoUrl = cleanPhoto;
      user.updatedAt = new Date().toISOString();
      updatedUser = user;

      // Also keep matching registration record synced
      if (db.registrations) {
        const reg = db.registrations.find(
          (r) =>
            r.assignedEmail?.toLowerCase() === user.email.toLowerCase() ||
            (r.studentName.toLowerCase() === user.name.toLowerCase() &&
              r.mobileNumber === user.phone)
        );
        if (reg) {
          reg.photoUrl = cleanPhoto;
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Student photo updated successfully.',
        photoUrl: cleanPhoto,
        student: {
          id: updatedUser?.id,
          name: updatedUser?.name,
          email: updatedUser?.email,
        },
      },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error('Update student photo error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update student photo.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json(
      { error: 'Unauthorized. Only administrators and instructors can remove student photos.' },
      { status: 403, headers: noCacheHeaders }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
    }

    await updateDb((db) => {
      const user = db.users.find((u) => u.id === studentId);
      if (!user) {
        throw new Error('Student account not found.');
      }

      if (user.studentDetails) {
        user.studentDetails.photoUrl = undefined;
        user.updatedAt = new Date().toISOString();
      }

      if (db.registrations) {
        const reg = db.registrations.find(
          (r) =>
            r.assignedEmail?.toLowerCase() === user.email.toLowerCase() ||
            (r.studentName.toLowerCase() === user.name.toLowerCase() &&
              r.mobileNumber === user.phone)
        );
        if (reg) {
          reg.photoUrl = undefined;
        }
      }
    });

    return NextResponse.json(
      { success: true, message: 'Student photo removed successfully.' },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error('Delete student photo error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove student photo.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
