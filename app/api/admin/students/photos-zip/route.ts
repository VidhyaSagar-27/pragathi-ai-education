import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  try {
    const db = await getDb();
    const students = (db.users || []).filter((u) => u.role === 'STUDENT');

    const zip = new JSZip();
    let photoCount = 0;

    for (const stu of students) {
      const photoUrl = stu.studentDetails?.photoUrl;
      if (!photoUrl || !photoUrl.includes('base64,')) continue;

      const rollNumber =
        stu.rollNumber || stu.studentDetails?.rollNumber || stu.studentDetails?.studentId || 'PRG';
      const cleanName = (stu.name || 'student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${rollNumber}_${cleanName}.jpg`;

      const base64Data = photoUrl.split('base64,')[1];
      if (base64Data) {
        const imageBuffer = Buffer.from(base64Data, 'base64');
        zip.file(filename, imageBuffer);
        photoCount++;
      }
    }

    if (photoCount === 0) {
      // Add a readme if no student photos exist yet
      zip.file(
        'README.txt',
        'No student photos are currently uploaded in the database. When students are registered with photos, they will appear here.'
      );
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const dateStamp = new Date().toISOString().split('T')[0];

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="pragathi_student_photos_${dateStamp}.zip"`,
        ...noCacheHeaders,
      },
    });
  } catch (error: any) {
    console.error('Download photos zip error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate photos zip' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
