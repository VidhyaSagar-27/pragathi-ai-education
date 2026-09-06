import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = await getDb();

  const totalStudents = db.users.filter((u) => u.role === 'STUDENT').length;
  const totalInstructors = db.users.filter((u) => u.role === 'INSTRUCTOR').length;
  const totalMaterials = db.materials.length;
  const totalQuizzes = db.quizzes.length;
  const totalAssignments = db.assignments.length;
  const pendingRegistrations = db.registrations.filter((r) => r.status === 'PENDING').length;
  const newMessages = db.messages.filter((m) => !m.isRead).length;
  const partnershipRequests = db.partnerships.length;

  return NextResponse.json({
    stats: {
      totalStudents,
      totalInstructors,
      totalMaterials,
      totalQuizzes,
      totalAssignments,
      pendingRegistrations,
      newMessages,
      partnershipRequests,
    },
    recentRegistrations: db.registrations.slice(0, 5),
    recentPartnerships: db.partnerships.slice(0, 5),
    recentMessages: db.messages.slice(0, 5),
  });
}
