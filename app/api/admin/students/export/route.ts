import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
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
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx';

    const db = await getDb();
    const students = (db.users || []).filter((u) => u.role === 'STUDENT');

    // Build safe student records - NEVER include password or passwordHash
    const rows = students.map((stu) => {
      const rollNumber =
        stu.rollNumber || stu.studentDetails?.rollNumber || stu.studentDetails?.studentId || 'N/A';
      return {
        'Roll Number': rollNumber,
        'Student Name': stu.name || '',
        'School Name': stu.studentDetails?.schoolName || '',
        'Class': stu.studentDetails?.classGrade || '',
        'Parent / Guardian Name': stu.studentDetails?.parentName || '',
        'Phone Number': stu.phone || stu.studentDetails?.parentPhone || '',
        'Email Address': stu.email || '',
        'Cohort Group': stu.studentDetails?.group || 'Foundation Batch',
        'Status': stu.status || 'ACTIVE',
        'Registration Date': stu.createdAt ? new Date(stu.createdAt).toLocaleDateString() : '',
      };
    });

    // Sort by roll number naturally
    rows.sort((a, b) => a['Roll Number'].localeCompare(b['Roll Number'], undefined, { numeric: true }));

    const dateStamp = new Date().toISOString().split('T')[0];

    if (format.toLowerCase() === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvOutput, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pragathi_students_${dateStamp}.csv"`,
          ...noCacheHeaders,
        },
      });
    }

    // Default: Excel .xlsx
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Auto-fit column widths
    const colWidths = [
      { wch: 14 }, // Roll Number
      { wch: 25 }, // Student Name
      { wch: 32 }, // School Name
      { wch: 10 }, // Class
      { wch: 24 }, // Parent Name
      { wch: 16 }, // Phone Number
      { wch: 24 }, // Email Address
      { wch: 20 }, // Cohort Group
      { wch: 12 }, // Status
      { wch: 18 }, // Registration Date
    ];
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pragathi_students_${dateStamp}.xlsx"`,
        ...noCacheHeaders,
      },
    });
  } catch (error: any) {
    console.error('Export students error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to export students' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
