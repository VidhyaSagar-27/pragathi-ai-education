import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb } from '@/lib/db';
import { ActivityItem, GalleryItem, AchievementItem, TestimonialItem } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = await getDb();
  return NextResponse.json({
    activities: db.activities,
    gallery: db.gallery,
    achievements: db.achievements,
    testimonials: db.testimonials,
  });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Type and data are required' }, { status: 400 });
    }

    if (type === 'activity') {
      const newActivity: ActivityItem = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: String(data.title).trim(),
        category: data.category || 'AI Awareness',
        description: String(data.description).trim(),
        learningOutcomes: String(data.learningOutcomes || '').trim(),
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
        createdAt: new Date().toISOString(),
      };
      await updateDb((dbState) => {
        dbState.activities.unshift(newActivity);
      });
      return NextResponse.json({ success: true, item: newActivity });
    }

    if (type === 'gallery') {
      const newGalleryItem: GalleryItem = {
        id: `gal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: String(data.title).trim(),
        category: data.category || 'Classroom',
        mediaType: data.mediaType || 'IMAGE',
        url: String(data.url).trim(),
        caption: String(data.caption || '').trim(),
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
        createdAt: new Date().toISOString(),
      };
      await updateDb((dbState) => {
        dbState.gallery.unshift(newGalleryItem);
      });
      return NextResponse.json({ success: true, item: newGalleryItem });
    }

    if (type === 'achievement') {
      const newAchievement: AchievementItem = {
        id: `ach_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: String(data.title).trim(),
        category: data.category || 'Student Recognition',
        description: String(data.description).trim(),
        date: String(data.date || new Date().toISOString().split('T')[0]),
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
        createdAt: new Date().toISOString(),
      };
      await updateDb((dbState) => {
        dbState.achievements.unshift(newAchievement);
      });
      return NextResponse.json({ success: true, item: newAchievement });
    }

    if (type === 'testimonial') {
      const newTestimonial: TestimonialItem = {
        id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        authorName: String(data.authorName).trim(),
        authorRole: String(data.authorRole || 'Parent').trim(),
        schoolOrOrg: String(data.schoolOrOrg || '').trim(),
        content: String(data.content).trim(),
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
        createdAt: new Date().toISOString(),
      };
      await updateDb((dbState) => {
        dbState.testimonials.unshift(newTestimonial);
      });
      return NextResponse.json({ success: true, item: newTestimonial });
    }

    return NextResponse.json({ error: 'Unknown CMS item type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!type || !id) {
    return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
  }

  await updateDb((dbState) => {
    if (type === 'activity') dbState.activities = dbState.activities.filter((i) => i.id !== id);
    if (type === 'gallery') dbState.gallery = dbState.gallery.filter((i) => i.id !== id);
    if (type === 'achievement') dbState.achievements = dbState.achievements.filter((i) => i.id !== id);
    if (type === 'testimonial') dbState.testimonials = dbState.testimonials.filter((i) => i.id !== id);
  });

  return NextResponse.json({ success: true });
}
