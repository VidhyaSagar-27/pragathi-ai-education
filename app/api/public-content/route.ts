import { NextResponse } from 'next/server';
import { getDb, getFallbackPublicData, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const edgeCacheHeaders = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json(
      {
        settings: db.settings || getFallbackPublicData().settings,
        modules: (db.modules && db.modules.length > 0) ? db.modules : getFallbackPublicData().modules,
        activities: (db.activities || []).filter((a) => a.isPublished),
        gallery: (db.gallery || []).filter((g) => g.isPublished),
        achievements: (db.achievements || []).filter((a) => a.isPublished),
        testimonials: (db.testimonials || []).filter((t) => t.isPublished),
      },
      { headers: edgeCacheHeaders }
    );
  } catch (error) {
    console.error('Failed to load database for public-content, using fallback:', error);
    return NextResponse.json(getFallbackPublicData(), { headers: edgeCacheHeaders });
  }
}
