import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { PushSubscriptionItem } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCacheHeaders });
  }

  try {
    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid push subscription object.' }, { status: 400 });
    }

    const db = await getDb();
    const studentUser = (db.users || []).find((u) => u.id === session.userId);
    const studentId = studentUser?.studentDetails?.studentId || session.userId;

    const newSub: PushSubscriptionItem = {
      id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      endpoint: subscription.endpoint,
      keys: subscription.keys || { p256dh: '', auth: '' },
      createdAt: new Date().toISOString(),
    };

    await updateDb((dbState) => {
      if (!dbState.pushSubscriptions) dbState.pushSubscriptions = [];
      // Remove any existing subscription with the same endpoint
      dbState.pushSubscriptions = dbState.pushSubscriptions.filter(
        (s) => s.endpoint !== subscription.endpoint
      );
      dbState.pushSubscriptions.push(newSub);
    });

    return NextResponse.json({ success: true, message: 'Push subscription stored.' }, { headers: noCacheHeaders });
  } catch (err: any) {
    console.error('Push subscribe error:', err);
    return NextResponse.json({ error: err.message || 'Failed to store push subscription' }, { status: 500 });
  }
}
