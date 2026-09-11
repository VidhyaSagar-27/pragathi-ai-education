import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SchoolPartnershipSection from '@/components/SchoolPartnershipSection';
import Link from 'next/link';
import { getDb, getFallbackPublicData } from '@/lib/db';
import { Building2, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Users, Award, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartnershipsPage() {
  const db = await getDb();
  const settings = db.settings || getFallbackPublicData().settings;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Page Hero */}
        <section className="bg-gradient-to-br from-brand-navy via-slate-900 to-indigo-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Building2 className="w-4 h-4" />
              <span>Institutional Onboarding & Collaboration</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
              Bring PRAGATHI AI to Your School
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Transform your school into an AI Centre of Excellence. We provide end-to-end curriculum licensing, interactive student laboratories, teacher training, and verifiable certification.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <a
                href="#partnership-form"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-brand-navy font-bold rounded-xl text-sm transition shadow-lg flex items-center space-x-2"
              >
                <span>Submit Institutional Request</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* 4 Partnership Benefits */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Turnkey 7-Module Curriculum</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Aligned with national educational standards for Grades 6 through 12, complete with lesson plans and lecture slides.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Teacher Upskilling & Training</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Comprehensive faculty certification workshops empowering your school&apos;s computer science educators to teach AI with confidence.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Cloud AI Lab Platform</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zero setup overhead. Students and faculty access browser-based interactive neural simulators and automated evaluations.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Co-Branded Digital Credentials</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students receive verifiable certificates carrying your school&apos;s name and PRAGATHI AI accreditation with a public verification registry.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partnership Form Component */}
        <div id="partnership-form" className="py-8">
          <SchoolPartnershipSection />
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
