import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await getDb();
  return NextResponse.json({
    settings: db.settings,
    modules: db.modules,
    activities: db.activities.filter((a) => a.isPublished),
    gallery: db.gallery.filter((g) => g.isPublished),
    achievements: db.achievements.filter((a) => a.isPublished),
    testimonials: db.testimonials.filter((t) => t.isPublished),
  });
}
