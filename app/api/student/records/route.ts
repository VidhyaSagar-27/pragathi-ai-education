import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, noCacheHeaders } from '@/lib/db';
import { User } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCacheHeaders });
  }

  const { searchParams } = new URL(req.url);
  // Allow admins to view any student, but students can ONLY view their own records
  let studentId = session.userId;
  if (session.role === 'ADMIN' || session.role === 'INSTRUCTOR') {
    const targetStudentId = searchParams.get('studentId');
    if (targetStudentId) studentId = targetStudentId;
  }

  const db = await getDb();
  const student = (db.users || []).find((u: User) => u.id === studentId);

  if (!student) {
    return NextResponse.json({ error: 'Student record not found' }, { status: 404, headers: noCacheHeaders });
  }

  // Attendance calculation
  const studentAttendance = (db.attendance || [])
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  const totalClasses = studentAttendance.length;
  const presentCount = studentAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const absentCount = studentAttendance.filter((a) => a.status === 'ABSENT').length;
  const attendancePercentage = totalClasses > 0 ? Number(((presentCount / totalClasses) * 100).toFixed(1)) : null;

  // Fee calculation
  const studentPayments = (db.payments || [])
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => (a.paymentDate > b.paymentDate ? -1 : 1));

  const totalFee = student.studentDetails?.feeRecord?.totalFee !== undefined
    ? student.studentDetails.feeRecord.totalFee
    : 1350;

  const amountPaid = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const amountPending = Math.max(0, totalFee - amountPaid);

  let feeStatus = 'PENDING';
  if (totalFee > 0 && amountPaid >= totalFee) {
    feeStatus = 'PAID';
  } else if (amountPaid > 0) {
    feeStatus = 'PARTIALLY_PAID';
  }

  return NextResponse.json(
    {
      student: {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber || student.studentDetails?.rollNumber || '',
        schoolName: student.studentDetails?.schoolName || '',
        classGrade: student.studentDetails?.classGrade || '',
        photoUrl: student.studentDetails?.photoUrl || '',
      },
      attendance: {
        totalClasses,
        presentCount,
        absentCount,
        percentage: attendancePercentage,
        history: studentAttendance,
      },
      fees: {
        totalFee,
        amountPaid,
        amountPending,
        status: feeStatus,
        lastPaymentDate: studentPayments[0]?.paymentDate || null,
        payments: studentPayments,
      },
    },
    { headers: noCacheHeaders }
  );
}
