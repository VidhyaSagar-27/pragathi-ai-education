import React from 'react';
import { getDb, getFallbackPublicData } from '@/lib/db';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  try {
    const db = await getDb();

    const publicData = {
      settings: db.settings || getFallbackPublicData().settings,
      modules: (db.modules && db.modules.length > 0) ? db.modules : getFallbackPublicData().modules,
      activities: (db.activities || []).filter((a) => a.isPublished),
      gallery: (db.gallery || []).filter((g) => g.isPublished),
      achievements: (db.achievements || []).filter((a) => a.isPublished),
      testimonials: (db.testimonials || []).filter((t) => t.isPublished),
    };

    return <HomeClient initialData={publicData} />;
  } catch (error) {
    console.error('Failed to load database for homepage, using fallback:', error);
    return <HomeClient initialData={getFallbackPublicData()} />;
  }
}
