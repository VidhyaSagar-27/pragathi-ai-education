import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  let submissions = db.quizSubmissions;

  if (session.role === 'STUDENT') {
    submissions = submissions.filter((s) => s.studentId === session.userId);
  }

  return NextResponse.json({ submissions });
}
