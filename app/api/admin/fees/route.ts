import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { FeePaymentStatus, StudentFeeRecord, User } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_PROGRAM_FEE = 1350;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const db = await getDb();
  const students = (db.users || []).filter((u: User) => u.role === 'STUDENT' && u.status === 'ACTIVE');
  const payments = db.payments || [];

  // Prepare each student's fee details
  const feeRoster = students.map((s) => {
    const existingFee: StudentFeeRecord | undefined = s.studentDetails?.feeRecord;
    const studentPayments = payments.filter((p) => p.studentId === s.id);
    const calculatedPaid = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const totalFee = existingFee?.totalFee !== undefined ? existingFee.totalFee : DEFAULT_PROGRAM_FEE;
    const amountPaid = calculatedPaid;
    const amountPending = Math.max(0, totalFee - amountPaid);

    let status: FeePaymentStatus = 'PENDING';
    if (totalFee > 0 && amountPaid >= totalFee) {
      status = 'PAID';
    } else if (amountPaid > 0) {
      status = 'PARTIALLY_PAID';
    } else {
      status = 'PENDING';
    }

    const lastPayment = studentPayments.sort((a, b) => (a.paymentDate > b.paymentDate ? -1 : 1))[0];

    return {
      studentId: s.id,
      name: s.name,
      rollNumber: s.rollNumber || s.studentDetails?.rollNumber || '',
      phone: s.phone || '',
      schoolName: s.studentDetails?.schoolName || '',
      classGrade: s.studentDetails?.classGrade || '',
      photoUrl: s.studentDetails?.photoUrl || '',
      totalFee,
      amountPaid,
      amountPending,
      status,
      lastPaymentDate: lastPayment?.paymentDate || existingFee?.lastPaymentDate || null,
      lastPaymentMethod: lastPayment?.paymentMethod || null,
      paymentCount: studentPayments.length,
      feeNotes: existingFee?.feeNotes || '',
    };
  }).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));

  // Aggregate Metrics
  const totalStudents = feeRoster.length;
  const totalExpected = feeRoster.reduce((sum, s) => sum + s.totalFee, 0);
  const totalCollected = feeRoster.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalPending = feeRoster.reduce((sum, s) => sum + s.amountPending, 0);
  const paidCount = feeRoster.filter((s) => s.status === 'PAID').length;
  const partiallyPaidCount = feeRoster.filter((s) => s.status === 'PARTIALLY_PAID').length;
  const pendingCount = feeRoster.filter((s) => s.status === 'PENDING').length;

  return NextResponse.json(
    {
      students: feeRoster,
      summary: {
        totalStudents,
        totalExpected,
        totalCollected,
        totalPending,
        paidCount,
        partiallyPaidCount,
        pendingCount,
      },
    },
    { headers: noCacheHeaders }
  );
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { studentId, totalFee, feeNotes } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const numTotal = Number(totalFee);
    if (isNaN(numTotal) || numTotal < 0) {
      return NextResponse.json({ error: 'Invalid total fee amount' }, { status: 400 });
    }

    await updateDb((db) => {
      const studentIndex = (db.users || []).findIndex((u) => u.id === studentId);
      if (studentIndex === -1) throw new Error('Student not found');

      const student = db.users[studentIndex];
      const studentPayments = (db.payments || []).filter((p) => p.studentId === studentId);
      const amountPaid = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const amountPending = Math.max(0, numTotal - amountPaid);

      let status: FeePaymentStatus = 'PENDING';
      if (numTotal > 0 && amountPaid >= numTotal) {
        status = 'PAID';
      } else if (amountPaid > 0) {
        status = 'PARTIALLY_PAID';
      }

      if (!student.studentDetails) {
        student.studentDetails = {
          classGrade: '',
          schoolName: '',
          parentName: '',
        };
      }

      student.studentDetails.feeRecord = {
        totalFee: numTotal,
        amountPaid,
        amountPending,
        status,
        feeNotes: feeNotes !== undefined ? feeNotes : student.studentDetails.feeRecord?.feeNotes || '',
        lastPaymentDate: student.studentDetails.feeRecord?.lastPaymentDate,
      };
      student.updatedAt = new Date().toISOString();
    });

    return NextResponse.json({ success: true, message: 'Fee settings updated' });
  } catch (err: any) {
    console.error('Error updating fee:', err);
    return NextResponse.json({ error: err.message || 'Failed to update fee' }, { status: 500 });
  }
}
