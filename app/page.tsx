import React from 'react';
import { getDb } from '@/lib/db';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = await getDb();

  const publicData = {
    settings: db.settings,
    modules: db.modules,
    activities: db.activities.filter((a) => a.isPublished),
    gallery: db.gallery.filter((g) => g.isPublished),
    achievements: db.achievements.filter((a) => a.isPublished),
    testimonials: db.testimonials.filter((t) => t.isPublished),
  };

  return <HomeClient initialData={publicData} />;
}
