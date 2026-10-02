import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { resetStudentBatchData, peekNextRollNumber, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized: Only administrators can reset student data.' },
      { status: 403, headers: noCacheHeaders }
    );
  }

  try {
    const body = await req.json();
    const { confirm } = body;

    if (confirm !== 'CONFIRM_RESET_ALL_STUDENTS') {
      return NextResponse.json(
        {
          error:
            'Confirmation failed. You must provide the exact confirmation string: CONFIRM_RESET_ALL_STUDENTS.',
        },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const result = await resetStudentBatchData();
    const nextRollNumber = await peekNextRollNumber();

    return NextResponse.json(
      {
        success: true,
        message:
          'All student accounts, registrations, and submissions have been reset. Next roll number is PRG001.',
        countRemoved: result.countRemoved,
        nextRollNumber,
      },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error('Reset student data error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reset student registrations' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
