import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { PaymentRecord, PaymentMethod, FeePaymentStatus } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');

  const db = await getDb();
  let payments = db.payments || [];

  if (studentId) {
    payments = payments.filter((p) => p.studentId === studentId);
  }

  // Sort by date descending
  payments = payments.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

  return NextResponse.json({ payments }, { headers: noCacheHeaders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      studentId,
      amount,
      paymentDate,
      paymentMethod = 'UPI',
      transactionId = '',
      notes = '',
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid payment amount greater than zero' }, { status: 400 });
    }

    if (!paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      return NextResponse.json({ error: 'Valid payment date (YYYY-MM-DD) is required' }, { status: 400 });
    }

    const recordedName = session.name || (session.role === 'ADMIN' ? 'Administrator' : 'Instructor');
    const now = new Date().toISOString();

    let createdPayment: PaymentRecord | null = null;
    let studentSummary: any = null;

    await updateDb((db) => {
      const studentIndex = (db.users || []).findIndex((u) => u.id === studentId);
      if (studentIndex === -1) {
        throw new Error('Student not found');
      }

      const student = db.users[studentIndex];
      const rollNumber = student.rollNumber || student.studentDetails?.rollNumber || '';
      const studentName = student.name;

      if (!db.payments) db.payments = [];

      // Generate next receipt / payment ID: PAY-0001, PAY-0002...
      const nextSeq = db.payments.length + 1;
      const paymentId = `PAY-${String(nextSeq).padStart(4, '0')}`;
      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${String(nextSeq).padStart(3, '0')}`;

      createdPayment = {
        id: paymentId,
        receiptNumber,
        studentId,
        studentRollNumber: rollNumber,
        studentName,
        amount: numAmount,
        paymentDate,
        paymentMethod: paymentMethod as PaymentMethod,
        transactionId: transactionId ? String(transactionId).trim() : undefined,
        recordedBy: session.userId,
        recordedByName: recordedName,
        notes: notes ? String(notes).trim() : undefined,
        createdAt: now,
        updatedAt: now,
      };

      db.payments.push(createdPayment);

      // Recalculate student fee state
      const studentPayments = db.payments.filter((p) => p.studentId === studentId);
      const totalPaid = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      const existingTotal = student.studentDetails?.feeRecord?.totalFee !== undefined
        ? student.studentDetails.feeRecord.totalFee
        : 1350;

      const pending = Math.max(0, existingTotal - totalPaid);

      let status: FeePaymentStatus = 'PENDING';
      if (existingTotal > 0 && totalPaid >= existingTotal) {
        status = 'PAID';
      } else if (totalPaid > 0) {
        status = 'PARTIALLY_PAID';
      }

      if (!student.studentDetails) {
        student.studentDetails = { classGrade: '', schoolName: '', parentName: '' };
      }

      student.studentDetails.feeRecord = {
        totalFee: existingTotal,
        amountPaid: totalPaid,
        amountPending: pending,
        status,
        lastPaymentDate: paymentDate,
        feeNotes: student.studentDetails.feeRecord?.feeNotes || '',
      };
      student.updatedAt = now;

      studentSummary = {
        studentName,
        rollNumber,
        totalFee: existingTotal,
        totalPaid,
        pendingAmount: pending,
        status,
      };

      // Add to audit logs
      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.unshift({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'RECORD_PAYMENT',
        performedBy: recordedName,
        targetId: paymentId,
        targetType: 'PAYMENT',
        targetEntity: `Payment of ₹${numAmount} for ${rollNumber} (${studentName})`,
        details: {
          paymentId,
          amount: numAmount,
          paymentMethod,
          paymentDate,
          totalPaid,
          pendingAmount: pending,
          status,
        },
        timestamp: now,
      });
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully for ${studentSummary?.rollNumber}.`,
      payment: createdPayment,
      studentSummary,
    });
  } catch (err: any) {
    console.error('Error recording payment:', err);
    return NextResponse.json({ error: err.message || 'Failed to record payment' }, { status: 500 });
  }
}
