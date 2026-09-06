import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { VideoItem } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get('moduleId');

  const db = await getDb();
  let videos = db.videos || [];

  if (session?.role === 'STUDENT' || !session) {
    videos = videos.filter((v) => v.isPublished);
  }

  if (moduleId) {
    videos = videos.filter((v) => v.moduleId === Number(moduleId));
  }

  return NextResponse.json({ videos }, { headers: noCacheHeaders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, moduleId, description, url, provider, isPublished } = body;

    if (!title || !moduleId || !url) {
      return NextResponse.json({ error: 'Title, Module, and Video URL are required' }, { status: 400 });
    }

    let detectedProvider: VideoItem['provider'] = provider || 'YOUTUBE';
    if (url.includes('drive.google.com')) {
      detectedProvider = 'GOOGLE_DRIVE';
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      detectedProvider = 'YOUTUBE';
    }

    const newVideo: VideoItem = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      moduleId: Number(moduleId),
      description: description ? String(description).trim() : '',
      url: String(url).trim(),
      provider: detectedProvider,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      createdBy: session.userId,
      creatorName: session.name,
      createdAt: new Date().toISOString(),
    };

    await updateDb((dbState) => {
      dbState.videos.unshift(newVideo);
    });

    return NextResponse.json({ success: true, video: newVideo });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, title, moduleId, description, url, isPublished } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await updateDb((dbState) => {
      const vid = dbState.videos.find((v) => v.id === id);
      if (vid) {
        if (title) vid.title = String(title).trim();
        if (moduleId) vid.moduleId = Number(moduleId);
        if (description !== undefined) vid.description = String(description).trim();
        if (url) {
          vid.url = String(url).trim();
          if (vid.url.includes('drive.google.com')) vid.provider = 'GOOGLE_DRIVE';
          else if (vid.url.includes('youtube.com') || vid.url.includes('youtu.be')) vid.provider = 'YOUTUBE';
        }
        if (isPublished !== undefined) vid.isPublished = Boolean(isPublished);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
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
    dbState.videos = dbState.videos.filter((v) => v.id !== id);
  });

  return NextResponse.json({ success: true });
}
