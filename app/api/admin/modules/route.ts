import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { ModuleItem } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const db = await getDb();
  return NextResponse.json({ modules: db.modules || [] }, { headers: noCacheHeaders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can add or modify the curriculum syllabus' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, topics, learningOutcome, description, iconName } = body;

    if (!title || !topics || !Array.isArray(topics)) {
      return NextResponse.json({ error: 'Module title and topics list are required.' }, { status: 400 });
    }

    let createdModule: ModuleItem | null = null;

    await updateDb((db) => {
      const nextId = db.modules.length > 0 ? Math.max(...db.modules.map((m) => m.id)) + 1 : 1;
      const nextNumber = db.modules.length + 1;
      createdModule = {
        id: nextId,
        number: nextNumber,
        title: title.trim(),
        iconName: iconName || 'BookOpen',
        topics: topics.map((t: string) => t.trim()).filter(Boolean),
        learningOutcome: (learningOutcome || '').trim(),
        description: (description || '').trim(),
      };
      db.modules.push(createdModule);
    });

    return NextResponse.json({ success: true, module: createdModule });
  } catch (err) {
    console.error('Failed to create module:', err);
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can modify the curriculum syllabus' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, title, topics, learningOutcome, description, iconName, modules } = body;

    // Bulk reorder support
    if (modules && Array.isArray(modules)) {
      await updateDb((db) => {
        db.modules = modules.map((m, idx) => ({
          ...m,
          number: idx + 1,
        }));
      });
      return NextResponse.json({ success: true, message: 'Curriculum order updated.' });
    }

    if (!id || !title) {
      return NextResponse.json({ error: 'Module ID and Title are required.' }, { status: 400 });
    }

    await updateDb((db) => {
      const idx = db.modules.findIndex((m) => m.id === Number(id));
      if (idx !== -1) {
        db.modules[idx] = {
          ...db.modules[idx],
          title: title.trim(),
          iconName: iconName || db.modules[idx].iconName || 'BookOpen',
          topics: Array.isArray(topics) ? topics.map((t: string) => t.trim()).filter(Boolean) : db.modules[idx].topics,
          learningOutcome: learningOutcome !== undefined ? learningOutcome.trim() : db.modules[idx].learningOutcome,
          description: description !== undefined ? description.trim() : db.modules[idx].description,
        };
      }
    });

    return NextResponse.json({ success: true, message: 'Module updated successfully.' });
  } catch (err) {
    console.error('Failed to update module:', err);
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can delete syllabus modules' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Module ID required' }, { status: 400 });

    await updateDb((db) => {
      db.modules = db.modules.filter((m) => m.id !== Number(id));
      // Re-number sequentially
      db.modules.forEach((m, idx) => {
        m.number = idx + 1;
      });
    });

    return NextResponse.json({ success: true, message: 'Module removed successfully.' });
  } catch (err) {
    console.error('Failed to delete module:', err);
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
  }
}
