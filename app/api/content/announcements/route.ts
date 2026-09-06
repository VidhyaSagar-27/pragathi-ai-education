import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { Announcement } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const db = await getDb();
  let announcements = db.announcements || [];

  if (session?.role === 'STUDENT') {
    announcements = announcements.filter((a) => a.targetRole === 'ALL' || a.targetRole === 'STUDENT');
  } else if (session?.role === 'INSTRUCTOR') {
    announcements = announcements.filter((a) => a.targetRole === 'ALL' || a.targetRole === 'INSTRUCTOR');
  }

  return NextResponse.json({ announcements }, { headers: noCacheHeaders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, message, targetRole, targetGroup } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and Message are required' }, { status: 400 });
    }

    const newAnnouncement: Announcement = {
      id: `anc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      message: String(message).trim(),
      targetRole: targetRole || 'ALL',
      targetGroup: targetGroup ? String(targetGroup).trim() : 'All',
      authorName: session.name,
      createdAt: new Date().toISOString(),
    };

    await updateDb((dbState) => {
      dbState.announcements.unshift(newAnnouncement);
    });

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await updateDb((dbState) => {
    dbState.announcements = dbState.announcements.filter((a) => a.id !== id);
  });

  return NextResponse.json({ success: true });
}
