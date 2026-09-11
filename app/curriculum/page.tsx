import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SyllabusSection from '@/components/SyllabusSection';
import Link from 'next/link';
import { getDb, getFallbackPublicData } from '@/lib/db';
import { BookOpen, Sparkles, ArrowRight, Award, CheckCircle2, Cpu, FileCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CurriculumPage() {
  const db = await getDb();
  const settings = db.settings || getFallbackPublicData().settings;
  const modules = db.modules && db.modules.length > 0 ? db.modules : getFallbackPublicData().modules;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Page Hero */}
        <section className="bg-gradient-to-br from-brand-navy via-slate-900 to-teal-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4">
              <BookOpen className="w-4 h-4" />
              <span>Official Academic Syllabus</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
              7-Module Comprehensive AI Curriculum
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Carefully engineered for middle and high school students—bridging foundational computational thinking to advanced machine learning, neural networks, robotics, and generative AI.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-brand-navy font-bold rounded-xl text-sm transition shadow-lg flex items-center space-x-2"
              >
                <span>Enroll in Curriculum</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/playground"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition flex items-center space-x-2"
              >
                <Cpu className="w-4 h-4 text-teal-400" />
                <span>Try Hands-On AI Playground</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Curriculum Highlights Bar */}
        <div className="bg-white border-b border-slate-200 py-6 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-teal-700">7</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Core Modules</p>
            </div>
            <div>
              <p className="text-2xl font-black text-brand-navy">35+</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Curriculum Topics</p>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-700">100%</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Hands-On Labs</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-700">Verified</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Digital Certificate</p>
            </div>
          </div>
        </div>

        {/* Full 7-Module Interactive Syllabus Component */}
        <div className="py-8">
          <SyllabusSection modules={modules} />
        </div>

        {/* Assessment & Evaluation Structure */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Multi-Mode Evaluation System
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                How Student Progress is Assessed
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Every module includes rigorous, automatic evaluations providing immediate feedback and detailed scorecards.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-black">MCQ</span>
                <h3 className="font-bold text-slate-900 text-sm">Multiple Choice Questions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluates conceptual retention, definitions, and algorithmic choices with randomized options.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-black">FIB</span>
                <h3 className="font-bold text-slate-900 text-sm">Fill-in-the-Blanks</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tests exact terminology, mathematical symbols, formula parameters, and neural network weights.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-black">TH</span>
                <h3 className="font-bold text-slate-900 text-sm">Theory Conceptual Questions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students articulate reasoning; automatically evaluated using semantic rubric and keyword validation.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">LAB</span>
                <h3 className="font-bold text-slate-900 text-sm">Hands-On Assignments</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Practical capstone submissions where students upload projects or simulator outputs for faculty review.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-14 px-4 bg-gradient-to-r from-brand-navy to-teal-900 text-white text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black">
              Start Learning the 7 AI Modules Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Registration is open for students in Grades 6–12. Complete the program and earn your verifiable digital credentials.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 bg-teal-400 hover:bg-teal-500 text-slate-950 font-bold rounded-xl text-sm transition"
              >
                Enroll Now
              </Link>
              <Link
                href="/register?tab=status"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition"
              >
                Check Application Status
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
