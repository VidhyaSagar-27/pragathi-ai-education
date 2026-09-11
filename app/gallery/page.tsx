import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GallerySection from '@/components/GallerySection';
import Link from 'next/link';
import { getDb, getFallbackPublicData } from '@/lib/db';
import { Image, Sparkles, ArrowRight, Video, Camera } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const db = await getDb();
  const settings = db.settings || getFallbackPublicData().settings;
  const gallery = (db.gallery || []).filter((g) => g.isPublished);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Page Hero */}
        <section className="bg-gradient-to-br from-brand-navy via-slate-900 to-teal-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Camera className="w-4 h-4" />
              <span>Campus & Classroom Highlights</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
              PRAGATHI AI Media Gallery
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Explore photo captures and video highlights from our interactive AI classroom workshops, robotics prototyping sessions, and certification ceremonies.
            </p>
          </div>
        </section>

        {/* Gallery Section Component */}
        <div className="py-8">
          <GallerySection gallery={gallery} />
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
