import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AboutSection from '@/components/AboutSection';
import WhyPragathiSection from '@/components/WhyPragathiSection';
import WhyLearnAISection from '@/components/WhyLearnAISection';
import LearningJourneySection from '@/components/LearningJourneySection';
import Link from 'next/link';
import { getDb, getFallbackPublicData } from '@/lib/db';
import { Sparkles, ArrowRight, ShieldCheck, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const db = await getDb();
  const settings = db.settings || getFallbackPublicData().settings;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Dedicated Page Hero */}
        <section className="bg-gradient-to-br from-brand-navy via-slate-900 to-teal-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Institutional Vision & Philosophy</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
              About PRAGATHI AI Education
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Empowering India&apos;s next generation of school students with foundational artificial intelligence, practical machine learning, and ethical technological leadership.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-brand-navy font-bold rounded-xl text-sm transition shadow-lg flex items-center space-x-2"
              >
                <span>Enroll as a Student</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/curriculum"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition"
              >
                <span>Explore 7-Module Syllabus</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Mission, Vision, and 5 Focus Areas */}
        <div className="py-4">
          <AboutSection settings={settings} />
        </div>

        {/* Why Learn AI? (6 Educational Advantages) */}
        <div className="py-4 bg-white">
          <WhyLearnAISection />
        </div>

        {/* Why Choose PRAGATHI AI (8 Cards) */}
        <div className="py-4">
          <WhyPragathiSection />
        </div>

        {/* 5-Step Learning Roadmap */}
        <div className="py-4 bg-white">
          <LearningJourneySection />
        </div>

        {/* Bottom CTA Banner */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-900 to-brand-navy text-white text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black">
              Ready to Begin Your Artificial Intelligence Journey?
            </h2>
            <p className="text-sm sm:text-base text-teal-100 max-w-xl mx-auto">
              Enroll online in minutes or speak with our academic counselors about bringing PRAGATHI AI to your school campus.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="px-6 py-3.5 bg-teal-400 hover:bg-teal-500 text-slate-950 font-bold rounded-xl text-sm transition shadow-md"
              >
                Student Enrollment Registration
              </Link>
              <Link
                href="/partnerships"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition"
              >
                Partner With Us (For Schools)
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
