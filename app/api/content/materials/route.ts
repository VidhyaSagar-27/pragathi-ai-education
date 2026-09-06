import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb } from '@/lib/db';
import { StudyMaterial } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get('moduleId');

  const db = getDb();
  let materials = db.materials;

  // If student, filter only published materials
  if (session?.role === 'STUDENT' || !session) {
    materials = materials.filter((m) => m.isPublished);
  }

  if (moduleId) {
    materials = materials.filter((m) => m.moduleId === Number(moduleId));
  }

  return NextResponse.json({ materials });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, moduleId, type, description, fileUrl, fileName, isPublished } = body;

    if (!title || !moduleId) {
      return NextResponse.json({ error: 'Title and Module are required' }, { status: 400 });
    }

    const newMaterial: StudyMaterial = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      moduleId: Number(moduleId),
      type: type || 'NOTE',
      description: description ? String(description).trim() : '',
      fileUrl: fileUrl ? String(fileUrl).trim() : '',
      fileName: fileName ? String(fileName).trim() : 'Study Resource',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      createdBy: session.userId,
      creatorName: session.name,
      createdAt: new Date().toISOString(),
    };

    updateDb((dbState) => {
      dbState.materials.unshift(newMaterial);
    });

    return NextResponse.json({ success: true, material: newMaterial });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create study material' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, title, moduleId, type, description, fileUrl, fileName, isPublished } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    updateDb((dbState) => {
      const mat = dbState.materials.find((m) => m.id === id);
      if (mat) {
        if (title) mat.title = String(title).trim();
        if (moduleId) mat.moduleId = Number(moduleId);
        if (type) mat.type = type;
        if (description !== undefined) mat.description = String(description).trim();
        if (fileUrl !== undefined) mat.fileUrl = String(fileUrl).trim();
        if (fileName !== undefined) mat.fileName = String(fileName).trim();
        if (isPublished !== undefined) mat.isPublished = Boolean(isPublished);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update study material' }, { status: 500 });
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
    dbState.materials = dbState.materials.filter((m) => m.id !== id);
  });

  return NextResponse.json({ success: true });
}
