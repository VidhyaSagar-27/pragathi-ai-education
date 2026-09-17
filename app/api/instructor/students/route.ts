import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const db = await getDb();
  const students = (db.users || []).filter((u) => u.role === 'STUDENT');

  // Sanitize sensitive password hash before returning
  const safeStudents = students.map(({ passwordHash, ...safe }) => safe);
  return NextResponse.json({ users: safeStudents }, { headers: noCacheHeaders });
}
