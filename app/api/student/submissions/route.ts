import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCacheHeaders });
  }

  const db = await getDb();
  let submissions = db.quizSubmissions || [];

  if (session.role === 'STUDENT') {
    submissions = submissions.filter((s) => s.studentId === session.userId);
  }

  return NextResponse.json({ submissions }, { headers: noCacheHeaders });
}
