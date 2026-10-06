import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, getStudentPhoto, noCacheHeaders } from '@/lib/db';

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
    const photosFolder = zip.folder('photos');

    // Build safe student records for Excel
    const rows = students.map((stu) => {
      const rollNumber =
        stu.rollNumber || stu.studentDetails?.rollNumber || stu.studentDetails?.studentId || 'N/A';
      const cleanName = (stu.name || 'student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const photoFileName = `${rollNumber}_${cleanName}.jpg`;

      return {
        'Roll Number': rollNumber,
        'Student Name': stu.name || '',
        'Photo Filename': stu.studentDetails?.photoUrl ? photoFileName : 'No Photo Uploaded',
        'School Name': stu.studentDetails?.schoolName || '',
        'Class': stu.studentDetails?.classGrade || '',
        'Section': stu.studentDetails?.section || 'A',
        'Parent / Guardian Name': stu.studentDetails?.parentName || '',
        'Phone Number': stu.phone || stu.studentDetails?.parentPhone || '',
        'Email Address': stu.email || '',
        'Cohort Group': stu.studentDetails?.group || 'Foundation Batch',
        'Status': stu.status || 'ACTIVE',
        'Registration Date': stu.createdAt ? new Date(stu.createdAt).toLocaleDateString() : '',
      };
    });

    rows.sort((a, b) => a['Roll Number'].localeCompare(b['Roll Number'], undefined, { numeric: true }));

    // Generate Excel file
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    worksheet['!cols'] = [
      { wch: 14 }, // Roll Number
      { wch: 25 }, // Student Name
      { wch: 26 }, // Photo Filename
      { wch: 32 }, // School Name
      { wch: 10 }, // Class
      { wch: 10 }, // Section
      { wch: 24 }, // Parent Name
      { wch: 16 }, // Phone Number
      { wch: 24 }, // Email Address
      { wch: 20 }, // Cohort Group
      { wch: 12 }, // Status
      { wch: 18 }, // Registration Date
    ];

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    zip.file('students.xlsx', excelBuffer);

    // Add photos
    let photoCount = 0;
    for (const stu of students) {
      const photoUrl = (await getStudentPhoto(stu.id)) || stu.studentDetails?.photoUrl;
      if (!photoUrl || !photoUrl.includes('base64,')) continue;

      const rollNumber =
        stu.rollNumber || stu.studentDetails?.rollNumber || stu.studentDetails?.studentId || 'PRG';
      const cleanName = (stu.name || 'student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${rollNumber}_${cleanName}.jpg`;

      const base64Data = photoUrl.split('base64,')[1];
      if (base64Data && photosFolder) {
        const imageBuffer = Buffer.from(base64Data, 'base64');
        photosFolder.file(filename, imageBuffer);
        photoCount++;
      }
    }

    if (photoCount === 0 && photosFolder) {
      photosFolder.file('README.txt', 'No student photos uploaded yet.');
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
        'Content-Disposition': `attachment; filename="pragathi_students_and_photos_${dateStamp}.zip"`,
        ...noCacheHeaders,
      },
    });
  } catch (error: any) {
    console.error('Download bundle zip error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate bundle zip' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
