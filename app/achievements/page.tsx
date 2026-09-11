import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AchievementsSection from '@/components/AchievementsSection';
import Link from 'next/link';
import { getDb, getFallbackPublicData } from '@/lib/db';
import { Trophy, Sparkles, ArrowRight, Award, Star, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const db = await getDb();
  const settings = db.settings || getFallbackPublicData().settings;
  const achievements = (db.achievements || []).filter((a) => a.isPublished);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Page Hero */}
        <section className="bg-gradient-to-br from-brand-navy via-slate-900 to-amber-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Trophy className="w-4 h-4" />
              <span>Excellence & Distinction</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
              Student Achievements & Honors
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Celebrating the breakthrough innovations, competition laureates, and academic milestones achieved by our PRAGATHI AI students across India.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg flex items-center space-x-2"
              >
                <span>Join Our Achievers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Achievements Section Component */}
        <div className="py-8">
          <AchievementsSection achievements={achievements} />
        </div>

        {/* Bottom CTA */}
        <section className="py-14 px-4 bg-gradient-to-r from-brand-navy to-slate-900 text-white text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black">
              Be the Next AI Pioneer
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Enroll today and build your future in artificial intelligence, robotics, and computational sciences.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-brand-navy font-bold rounded-xl text-sm transition"
              >
                <span>Enroll in PRAGATHI AI</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
