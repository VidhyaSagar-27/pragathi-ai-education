import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { InAppNotification } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCacheHeaders });
  }

  const db = await getDb();
  const studentUser = (db.users || []).find((u) => u.id === session.userId);
  const studentId = studentUser?.studentDetails?.studentId || session.userId;

  const allNotifications = db.inAppNotifications || [];
  // Match by studentId, or by user id, or broadcast notifications ('ALL')
  const studentNotifications = allNotifications.filter(
    (n) => n.studentId === studentId || n.studentId === session.userId || n.studentId === 'ALL'
  );

  const unreadCount = studentNotifications.filter((n) => !n.isRead).length;

  return NextResponse.json({
    notifications: studentNotifications,
    unreadCount,
  }, { headers: noCacheHeaders });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCacheHeaders });
  }

  try {
    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    const db = await getDb();
    const studentUser = (db.users || []).find((u) => u.id === session.userId);
    const studentId = studentUser?.studentDetails?.studentId || session.userId;

    await updateDb((dbState) => {
      if (!dbState.inAppNotifications) return;

      if (markAllAsRead) {
        dbState.inAppNotifications.forEach((n) => {
          if (n.studentId === studentId || n.studentId === session.userId || n.studentId === 'ALL') {
            n.isRead = true;
          }
        });
      } else if (notificationId) {
        const item = dbState.inAppNotifications.find((n) => n.id === notificationId);
        if (item) item.isRead = true;
      }
    });

    return NextResponse.json({ success: true }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update notifications' }, { status: 500 });
  }
}
