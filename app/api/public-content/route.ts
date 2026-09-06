import { NextResponse } from 'next/server';
import { getDb, getFallbackPublicData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json({
      settings: db.settings || getFallbackPublicData().settings,
      modules: (db.modules && db.modules.length > 0) ? db.modules : getFallbackPublicData().modules,
      activities: (db.activities || []).filter((a) => a.isPublished),
      gallery: (db.gallery || []).filter((g) => g.isPublished),
      achievements: (db.achievements || []).filter((a) => a.isPublished),
      testimonials: (db.testimonials || []).filter((t) => t.isPublished),
    });
  } catch (error) {
    console.error('Failed to load database for public-content, using fallback:', error);
    return NextResponse.json(getFallbackPublicData());
  }
}
