import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb } from '@/lib/db';
import { Assignment } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get('moduleId');

  const db = getDb();
  let assignments = db.assignments;

  if (session?.role === 'STUDENT' || !session) {
    assignments = assignments.filter((a) => a.isPublished);
  }

  if (moduleId) {
    assignments = assignments.filter((a) => a.moduleId === Number(moduleId));
  }

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, moduleId, instructions, dueDate, targetGroup, attachmentUrl, isPublished } = body;

    if (!title || !moduleId || !instructions || !dueDate) {
      return NextResponse.json(
        { error: 'Title, Module, Instructions, and Due Date are required.' },
        { status: 400 }
      );
    }

    const newAssignment: Assignment = {
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      moduleId: Number(moduleId),
      instructions: String(instructions).trim(),
      dueDate: String(dueDate),
      targetGroup: targetGroup ? String(targetGroup).trim() : 'All Students',
      attachmentUrl: attachmentUrl ? String(attachmentUrl).trim() : undefined,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      createdBy: session.userId,
      creatorName: session.name,
      createdAt: new Date().toISOString(),
    };

    updateDb((dbState) => {
      dbState.assignments.unshift(newAssignment);
    });

    return NextResponse.json({ success: true, assignment: newAssignment });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, title, moduleId, instructions, dueDate, targetGroup, attachmentUrl, isPublished } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    updateDb((dbState) => {
      const asg = dbState.assignments.find((a) => a.id === id);
      if (asg) {
        if (title) asg.title = String(title).trim();
        if (moduleId) asg.moduleId = Number(moduleId);
        if (instructions !== undefined) asg.instructions = String(instructions).trim();
        if (dueDate) asg.dueDate = String(dueDate);
        if (targetGroup) asg.targetGroup = String(targetGroup).trim();
        if (attachmentUrl !== undefined) asg.attachmentUrl = attachmentUrl;
        if (isPublished !== undefined) asg.isPublished = Boolean(isPublished);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
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

  updateDb((dbState) => {
    dbState.assignments = dbState.assignments.filter((a) => a.id !== id);
  });

  return NextResponse.json({ success: true });
}
