'use client';

import React from 'react';
import { ArrowRight, BookOpen, Sparkles, Shield, Cpu, Compass } from 'lucide-react';
import HeroCanvas from './HeroCanvas';

interface HeroProps {
  onOpenRegister?: () => void;
  settings?: {
    heroHeading?: string;
    heroTagline?: string;
    heroDescription?: string;
  };
}

export default function Hero({ onOpenRegister, settings }: HeroProps) {
  const heading = settings?.heroHeading || 'PRAGATHI AI';
  const tagline = settings?.heroTagline || 'Empowering Students for the AI-Powered Future';
  const description =
    settings?.heroDescription ||
    'Discover the exciting world of Artificial Intelligence through structured learning, interactive activities, practical understanding, creativity, and future-ready skills.';

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-teal-50/20 pt-8 pb-20 lg:pt-16 lg:pb-32 border-b border-slate-100">
      {/* Background Neural Canvas */}
      <HeroCanvas />

      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-teal-200/30 via-indigo-100/30 to-purple-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Program Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs sm:text-sm font-medium mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-teal-600 animate-ping mr-1" />
            <span>Pragathi AI Foundation Program</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-normal">Next-Generation School Curriculum</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-4">
            <span className="block text-brand-navy">{heading}</span>
            <span className="block text-2xl sm:text-4xl lg:text-5xl font-bold mt-2 text-gradient-teal">
              {tagline}
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-brand-navy via-slate-900 to-teal-700 hover:from-slate-900 hover:to-teal-600 rounded-xl shadow-card hover:shadow-elevated transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <span>Join PRAGATHI AI</span>
              <ArrowRight className="ml-2.5 w-5 h-5" />
            </button>

            <a
              href="#syllabus"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-700 hover:text-teal-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-subtle hover:shadow-card transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <BookOpen className="mr-2.5 w-5 h-5 text-teal-600" />
              <span>Explore the Program</span>
            </a>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-16 pt-10 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/60 shadow-subtle">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 mb-2.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">7-Module Core</h4>
              <p className="text-xs text-slate-500 mt-1">Foundational to modern GenAI topics</p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/60 shadow-subtle">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 mb-2.5">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Hands-On Practice</h4>
              <p className="text-xs text-slate-500 mt-1">Real problem solving & project tasks</p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/60 shadow-subtle">
              <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 mb-2.5">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Structured Path</h4>
              <p className="text-xs text-slate-500 mt-1">From fundamentals to future ethics</p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/60 shadow-subtle">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 mb-2.5">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Responsible AI</h4>
              <p className="text-xs text-slate-500 mt-1">Ethics, privacy & societal impact</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
