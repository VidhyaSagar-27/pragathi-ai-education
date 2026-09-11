import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ActivitiesSection from '@/components/ActivitiesSection';
import Link from 'next/link';
import { getDb, getFallbackPublicData } from '@/lib/db';
import { Sparkles, ArrowRight, Award, Calendar, Lightbulb, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ActivitiesPage() {
  const db = await getDb();
  const settings = db.settings || getFallbackPublicData().settings;
  const activities = (db.activities || []).filter((a) => a.isPublished);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Page Hero */}
        <section className="bg-gradient-to-br from-brand-navy via-slate-900 to-indigo-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Experiential Learning & Innovation</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
              Student Activities & AI Workshops
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              From assembling autonomous robotics kits to competing in national hackathons—explore hands-on experiences that bring artificial intelligence to life.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-brand-navy font-bold rounded-xl text-sm transition shadow-lg flex items-center space-x-2"
              >
                <span>Join Student Activities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Activities Section Component */}
        <div className="py-8">
          <ActivitiesSection activities={activities} />
        </div>

        {/* 4 Pillars of Activity Learning */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Why Activities are Core to PRAGATHI AI
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                We believe true AI literacy happens when students experiment, fail, iterate, and build real systems.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Ideation to Prototype</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students identify real-world community problems and build functioning computer vision and NLP solutions.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Collaborative Hackathons</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cross-school hackathons simulating industry software engineering sprints and agile peer collaboration.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Showcase & Awards</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Top performing student projects receive institutional recognition, certificates of distinction, and mentorship.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
