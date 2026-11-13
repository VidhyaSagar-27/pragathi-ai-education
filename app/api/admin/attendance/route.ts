import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { AttendanceRecord, AttendanceStatus, User } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const studentId = searchParams.get('studentId');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const overview = searchParams.get('overview') === 'true';

  const db = await getDb();
  const attendanceList = db.attendance || [];
  const students = (db.users || []).filter((u: User) => u.role === 'STUDENT' && u.status === 'ACTIVE');

  // Overview mode for calendar & analytics
  if (overview) {
    const datesSet = new Set<string>();
    attendanceList.forEach((a) => {
      if (a.date) datesSet.add(a.date);
    });
    const markedDates = Array.from(datesSet).sort().reverse();

    // Calculate per-student attendance stats
    const studentStats = students.map((s) => {
      const studentRecords = attendanceList.filter((a) => a.studentId === s.id);
      const totalMarked = studentRecords.length;
      const presentCount = studentRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const absentCount = studentRecords.filter((a) => a.status === 'ABSENT').length;
      const percentage = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : null;

      return {
        studentId: s.id,
        name: s.name,
        rollNumber: s.rollNumber || s.studentDetails?.rollNumber || '',
        classGrade: s.studentDetails?.classGrade || 'Not Specified',
        schoolName: s.studentDetails?.schoolName || '',
        photoUrl: s.studentDetails?.photoUrl || '',
        totalClasses: totalMarked,
        present: presentCount,
        absent: absentCount,
        percentage,
        isLowAttendance: percentage !== null && percentage < 75,
      };
    });

    const totalRecords = attendanceList.length;
    const totalPresents = attendanceList.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const overallPercentage = totalRecords > 0 ? Number(((totalPresents / totalRecords) * 100).toFixed(1)) : null;

    return NextResponse.json(
      {
        markedDates,
        studentStats,
        overallPercentage,
        totalMarkedDates: markedDates.length,
      },
      { headers: noCacheHeaders }
    );
  }

  // Filter by single student
  if (studentId) {
    const records = attendanceList
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => (a.date > b.date ? -1 : 1));

    const totalMarked = records.length;
    const presentCount = records.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const absentCount = records.filter((a) => a.status === 'ABSENT').length;
    const percentage = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : null;

    return NextResponse.json(
      {
        records,
        stats: {
          totalClasses: totalMarked,
          present: presentCount,
          absent: absentCount,
          percentage,
        },
      },
      { headers: noCacheHeaders }
    );
  }

  // If a specific date is requested, prepare student roster with marked values
  if (date) {
    const recordsOnDate = attendanceList.filter((a) => a.date === date);
    const recordsByStudent = new Map<string, AttendanceRecord>();
    recordsOnDate.forEach((r) => recordsByStudent.set(r.studentId, r));

    const isMarkedForDate = recordsOnDate.length > 0;
    const markerInfo = recordsOnDate[0]
      ? {
          markedBy: recordsOnDate[0].markedBy,
          markedByName: recordsOnDate[0].markedByName,
          updatedAt: recordsOnDate[0].updatedAt,
        }
      : null;

    const studentRoster = students
      .map((s) => {
        const existing = recordsByStudent.get(s.id);
        return {
          studentId: s.id,
          name: s.name,
          rollNumber: s.rollNumber || s.studentDetails?.rollNumber || '',
          classGrade: s.studentDetails?.classGrade || 'Not Specified',
          section: s.studentDetails?.section || '',
          schoolName: s.studentDetails?.schoolName || '',
          phone: s.phone || '',
          photoUrl: s.studentDetails?.photoUrl || '',
          status: existing ? existing.status : ('PRESENT' as AttendanceStatus),
          remarks: existing?.remarks || '',
          isRecorded: !!existing,
          attendanceId: existing?.id,
        };
      })
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));

    const presentCount = studentRoster.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentCount = studentRoster.filter((r) => r.status === 'ABSENT').length;

    return NextResponse.json(
      {
        date,
        isMarkedForDate,
        markerInfo,
        students: studentRoster,
        summary: {
          total: studentRoster.length,
          present: presentCount,
          absent: absentCount,
        },
      },
      { headers: noCacheHeaders }
    );
  }

  // Date range filter
  let filtered = [...attendanceList];
  if (fromDate) filtered = filtered.filter((a) => a.date >= fromDate);
  if (toDate) filtered = filtered.filter((a) => a.date <= toDate);

  return NextResponse.json(
    {
      attendance: filtered.sort((a, b) => (a.date > b.date ? -1 : 1)),
      total: filtered.length,
    },
    { headers: noCacheHeaders }
  );
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { date, records } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required' }, { status: 400 });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Attendance records array is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const markerName = session.name || (session.role === 'ADMIN' ? 'Administrator' : 'Instructor');

    await updateDb((db) => {
      if (!db.attendance) db.attendance = [];
      const studentMap = new Map<string, User>();
      (db.users || []).forEach((u) => {
        if (u.role === 'STUDENT') studentMap.set(u.id, u);
      });

      for (const rec of records) {
        if (!rec.studentId) continue;
        const student = studentMap.get(rec.studentId);
        const roll = student?.rollNumber || student?.studentDetails?.rollNumber || '';
        const name = student?.name || 'Student';

        const existingIndex = db.attendance.findIndex(
          (a) => a.date === date && a.studentId === rec.studentId
        );

        const status: AttendanceStatus = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(rec.status)
          ? rec.status
          : 'PRESENT';

        if (existingIndex >= 0) {
          // Update existing without duplicating
          db.attendance[existingIndex] = {
            ...db.attendance[existingIndex],
            status,
            remarks: rec.remarks || '',
            markedBy: session.userId,
            markedByName: markerName,
            updatedAt: now,
          };
        } else {
          // Add new record
          db.attendance.push({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            date,
            studentId: rec.studentId,
            studentRollNumber: roll,
            studentName: name,
            status,
            remarks: rec.remarks || '',
            markedBy: session.userId,
            markedByName: markerName,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // Add audit log entry
      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.unshift({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'MARK_ATTENDANCE',
        performedBy: markerName,
        targetId: date,
        targetType: 'ATTENDANCE',
        targetEntity: `Attendance for ${date}`,
        details: {
          date,
          totalMarked: records.length,
          presentCount: records.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length,
          absentCount: records.filter((r: any) => r.status === 'ABSENT').length,
        },
        timestamp: now,
      });
    });

    return NextResponse.json({
      success: true,
      message: `Attendance for ${date} saved successfully.`,
      date,
      count: records.length,
    });
  } catch (err: any) {
    console.error('Error saving attendance:', err);
    return NextResponse.json({ error: err.message || 'Failed to save attendance' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required' }, { status: 400 });
  }

  const markerName = session.name || (session.role === 'ADMIN' ? 'Administrator' : 'Instructor');
  const now = new Date().toISOString();

  let removedCount = 0;
  try {
    await updateDb((db) => {
      if (!db.attendance) db.attendance = [];
      const beforeCount = db.attendance.length;
      db.attendance = db.attendance.filter((a) => a.date !== date);
      removedCount = beforeCount - db.attendance.length;

      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.unshift({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'DELETE_ATTENDANCE_DATE',
        performedBy: markerName,
        targetId: date,
        targetType: 'ATTENDANCE',
        targetEntity: `Removed attendance for ${date}`,
        details: { date, recordsRemoved: removedCount },
        timestamp: now,
      });
    });

    return NextResponse.json({
      success: true,
      message: `Attendance for date ${date} removed successfully.`,
      date,
      removedCount,
    });
  } catch (err: any) {
    console.error('Error removing attendance date:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete attendance' }, { status: 500 });
  }
}
