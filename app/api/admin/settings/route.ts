import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const db = await getDb();
  return NextResponse.json({ settings: db.settings }, { headers: noCacheHeaders });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    await updateDb((dbState) => {
      dbState.settings = {
        ...dbState.settings,
        ...body,
        updatedAt: new Date().toISOString(),
      };
    });

    const db = await getDb();
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
