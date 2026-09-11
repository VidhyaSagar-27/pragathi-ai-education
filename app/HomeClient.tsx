'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import RegistrationModal from '@/components/RegistrationModal';
import {
  BookOpen,
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Building2,
  Users,
  Target,
  Trophy,
  Phone,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface HomeClientProps {
  initialData: {
    settings: any;
    modules: any[];
    activities: any[];
    gallery: any[];
    achievements: any[];
    testimonials: any[];
  };
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { settings, modules, activities, achievements } = initialData;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <Navbar onOpenRegister={() => setIsRegisterOpen(true)} />

      <main className="flex-grow">
        {/* 1. Hero Section */}
        <Hero
          onOpenRegister={() => setIsRegisterOpen(true)}
          settings={settings}
        />

        {/* 2. Key Platform Metrics Bar */}
        <section className="bg-white border-y border-slate-200 py-6 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-teal-700">7</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Core Modules</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-brand-navy">35+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Curriculum Topics</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-indigo-700">10,000+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Concurrent Capacity</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-emerald-700">100%</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Verifiable Credentials</p>
            </div>
          </div>
        </section>

        {/* 3. Streamlined 7-Module Curriculum Overview */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Foundational to Advanced AI</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                7-Module Comprehensive AI Curriculum
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl">
                Transcribed from our official handwritten syllabus—designed to take school students from the basics of state-space search to deep learning, robotics, and LLMs.
              </p>
            </div>

            <Link
              href="/curriculum"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm shrink-0 w-fit"
            >
              <span>Explore Full 7-Module Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Module Grid Preview (Compact Cards) */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(modules || []).slice(0, 7).map((m: any) => (
              <Link
                key={m.id}
                href="/curriculum"
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-500 hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center text-xs font-black group-hover:bg-teal-600 group-hover:text-white transition">
                      0{m.number || m.id}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {(m.topics || []).length} Topics
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {m.description || m.learningOutcome || (m.topics || []).slice(0, 3).join(', ')}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}

            {/* View Full Curriculum Card */}
            <Link
              href="/curriculum"
              className="bg-gradient-to-br from-brand-navy to-teal-900 text-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <span className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center text-xs font-black mb-3">
                  ★
                </span>
                <h3 className="font-bold text-white text-sm">
                  Complete Curriculum Guide
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  View full topic syllabi, learning outcomes, and multi-mode assessment rubrics across all 7 modules.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold text-teal-300">
                <span>Explore Full Syllabus</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          </div>
        </section>

        {/* 4. Interactive AI Playground Spotlight */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-brand-navy to-teal-950 text-white">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Zero-Installation Browser Labs</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Hands-on AI Playground: Experience Algorithms Live
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                Why just read about artificial intelligence when you can simulate it? Our interactive laboratory allows students to adjust weights, train artificial neurons, test prompt engineering personas, and run computer vision convolution filters in real time.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs">
                  <strong className="block text-teal-300">1. Artificial Neuron</strong>
                  <span className="text-slate-300 text-[11px]">Weights, bias & activations</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs">
                  <strong className="block text-teal-300">2. Prompt Lab</strong>
                  <span className="text-slate-300 text-[11px]">Personas & temperature</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs">
                  <strong className="block text-teal-300">3. Convolutions</strong>
                  <span className="text-slate-300 text-[11px]">Sobel edge & filter kernels</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/playground"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-teal-400 hover:bg-teal-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-lg cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Launch Interactive AI Playground</span>
                </Link>
              </div>
            </div>

            {/* Visual Interactive Teaser Card */}
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 text-xs">
                <span className="font-mono text-teal-400 font-bold">● Perceptron Neural Circuit</span>
                <span className="text-slate-400 text-[11px]">Activation: ReLU</span>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Formula: z = (x₁·w₁ + x₂·w₂) + b</span>
                  <span className="text-emerald-400 font-bold">Output: ŷ = 1.40</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 w-3/4 animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Try moving sliders to see how real-world artificial neural networks learn patterns and classify images.
              </p>
            </div>
          </div>
        </section>

        {/* 5. About & Educational Pillars Spotlight */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 uppercase tracking-wider">
                <Target className="w-4 h-4 text-teal-600" />
                <span>Our Purpose & Philosophy</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Empowering India&apos;s School Students with AI Literacy
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                PRAGATHI AI is an educational movement designed to introduce artificial intelligence in a simple, practical, engaging, and understandable way. We bridge the gap between abstract academic theory and hands-on technological creation.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs sm:text-sm text-slate-900 font-bold">Hands-On Before Theory:</strong>
                    <p className="text-xs text-slate-500 mt-0.5">Students build neural models, prompt personas, and vision filters before deep mathematical abstraction.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs sm:text-sm text-slate-900 font-bold">Ethical & Cyber Safety First:</strong>
                    <p className="text-xs text-slate-500 mt-0.5">Comprehensive grounding in bias mitigation, synthetic media deepfakes, and responsible AI usage.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs sm:text-sm text-slate-900 font-bold">Verifiable Digital Credentials:</strong>
                    <p className="text-xs text-slate-500 mt-0.5">Every student who passes curriculum evaluations earns a cryptographically verifiable certificate.</p>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Link
                  href="/about"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
                >
                  <span>Learn More About PRAGATHI AI</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* 5 Core Pillars Mini Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">01</span>
                <h3 className="font-bold text-slate-900 text-sm">AI Awareness</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Demystifying how smart systems interpret sensory signals and make predictions.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">02</span>
                <h3 className="font-bold text-slate-900 text-sm">Algorithmic Logic</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Cultivating systematic problem-solving, search trees, and computational thinking.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">03</span>
                <h3 className="font-bold text-slate-900 text-sm">Creative Building</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Inspiring students to design original AI applications and robotics prototypes.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">04</span>
                <h3 className="font-bold text-slate-900 text-sm">Career Trajectories</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Connecting school curriculum to high-demand trajectories in ML and data science.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Activities & Achievements Section Teasers */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Activities Teaser Card */}
              <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Hands-On Workshops</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Student Activities & AI Workshops
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Explore interactive robotics challenges, neural circuit hackathons, and guest masterclasses that foster team engineering and creativity.
                  </p>
                </div>
                <Link
                  href="/activities"
                  className="inline-flex items-center space-x-2 font-bold text-xs sm:text-sm text-indigo-700 hover:text-indigo-900"
                >
                  <span>Explore All Activities & Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Achievements Teaser Card */}
              <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                    <Trophy className="w-4 h-4" />
                    <span>Excellence & Recognition</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Student Achievements & Honors
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Celebrating outstanding accomplishments, National AI Olympiad laureates, and creative capstone prototypes created by PRAGATHI AI learners.
                  </p>
                </div>
                <Link
                  href="/achievements"
                  className="inline-flex items-center space-x-2 font-bold text-xs sm:text-sm text-amber-700 hover:text-amber-900"
                >
                  <span>View All Student Achievements</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Bring PRAGATHI AI to Your School Banner */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-brand-navy to-indigo-950 text-white">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
                For School Principals & Trustees
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Bring PRAGATHI AI to Your School Campus
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Empower your students with a turnkey AI curriculum, teacher training certification, and interactive cloud labs aligned with national curriculum guidelines.
              </p>
            </div>

            <div className="shrink-0 flex flex-col gap-3">
              <Link
                href="/partnerships"
                className="px-6 py-3.5 bg-teal-400 hover:bg-teal-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-md text-center"
              >
                Submit School Partnership Form
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/20 transition text-center"
              >
                Contact Admissions Team
              </Link>
            </div>
          </div>
        </section>

        {/* 8. Helpdesk & Quick Credentials Banner */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-slate-100 border-t border-slate-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3 text-slate-600">
              <Phone className="w-4 h-4 text-teal-600" />
              <span>
                Need help or have questions? Call us: <strong>+91 9618611522</strong> | <strong>+91 6281738986</strong>
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/register?tab=status" className="font-bold text-teal-700 hover:underline">
                Retrieve Login Password →
              </Link>
              <Link href="/contact" className="font-bold text-slate-700 hover:underline">
                Campus Coordinates & Support →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer settings={settings} />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
