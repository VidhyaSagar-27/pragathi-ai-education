import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, getStudentPhoto, saveStudentPhoto, deleteStudentPhoto, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing student ID', { status: 400 });
  }

  try {
    const photo = await getStudentPhoto(id);
    if (!photo) {
      return new NextResponse('Photo not found', { status: 404 });
    }

    if (photo.startsWith('data:image/')) {
      const commaIndex = photo.indexOf(',');
      const meta = photo.substring(0, commaIndex);
      const base64Data = photo.substring(commaIndex + 1);
      const mimeMatch = meta.match(/data:([^;]+)/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        },
      });
    }

    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return NextResponse.redirect(photo);
    }

    return new NextResponse('Invalid photo format', { status: 400 });
  } catch (error: any) {
    console.error('Fetch student photo error:', error);
    return new NextResponse('Error loading photo', { status: 500 });
  }
}

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

    // 1. Save photo to dedicated high-speed student_photos table
    await saveStudentPhoto(studentId, cleanPhoto);

    // 2. Set lightweight endpoint URL in db.users so DB row stays small
    const photoEndpointUrl = `/api/students/photo?id=${studentId}&v=${Date.now()}`;
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

      user.studentDetails.photoUrl = photoEndpointUrl;
      user.updatedAt = new Date().toISOString();
      updatedUser = user;

      // Also keep matching registration record synced
      if (db.registrations) {
        const reg = db.registrations.find(
          (r) =>
            (user.rollNumber && r.rollNumber?.toLowerCase() === user.rollNumber.toLowerCase()) ||
            (user.email && r.assignedEmail && r.assignedEmail.toLowerCase() === user.email.toLowerCase()) ||
            (r.studentName.toLowerCase() === user.name.toLowerCase() &&
              r.mobileNumber === user.phone)
        );
        if (reg) {
          reg.photoUrl = photoEndpointUrl;
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Student photo updated successfully.',
        photoUrl: photoEndpointUrl,
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

    // 1. Delete from student_photos table
    await deleteStudentPhoto(studentId);

    // 2. Clear photo from db.users
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
            (user.rollNumber && r.rollNumber?.toLowerCase() === user.rollNumber.toLowerCase()) ||
            (user.email && r.assignedEmail && r.assignedEmail.toLowerCase() === user.email.toLowerCase()) ||
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
