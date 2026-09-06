'use client';

import React from 'react';
import { BookOpen, Compass, Dumbbell, Sparkles, Trophy, ArrowRight } from 'lucide-react';

export default function LearningJourneySection() {
  const steps = [
    {
      stage: '01',
      action: 'LEARN',
      title: 'Understand Core Concepts',
      description: 'Understand important AI concepts, definitions, computational logic, and foundational terminology.',
      icon: BookOpen,
      accent: 'from-blue-600 to-indigo-600',
    },
    {
      stage: '02',
      action: 'EXPLORE',
      title: 'Discover Real-World AI',
      description: 'Discover how AI works in the real world, from computer vision to language models and smart devices.',
      icon: Compass,
      accent: 'from-teal-600 to-cyan-600',
    },
    {
      stage: '03',
      action: 'PRACTICE',
      title: 'Hands-on Activities',
      description: 'Participate in activities and exercises that test algorithms, heuristics, and pattern identification.',
      icon: Dumbbell,
      accent: 'from-indigo-600 to-purple-600',
    },
    {
      stage: '04',
      action: 'CREATE',
      title: 'Build With Modern Tools',
      description: 'Explore creative projects and modern AI tools to produce prototypes, artwork, prompts, and presentations.',
      icon: Sparkles,
      accent: 'from-purple-600 to-pink-600',
    },
    {
      stage: '05',
      action: 'ACHIEVE',
      title: 'Demonstrate & Earn',
      description: 'Demonstrate learning through capstone evaluations, challenges, and earn verified recognition certificates.',
      icon: Trophy,
      accent: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-100 select-none cursor-default">
            Path to Mastery
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            The PRAGATHI AI Learning Journey
          </h2>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            A progressive, five-stage milestone framework that bridges curiosity with practical technological mastery.
          </p>
        </div>

        {/* Desktop Connected Horizontal Timeline */}
        <div className="hidden lg:grid grid-cols-5 gap-4 relative">
          {/* Connecting Track Line */}
          <div className="absolute top-16 left-12 right-12 h-1 bg-gradient-to-r from-blue-200 via-teal-200 to-amber-200 -z-0" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.action} className="relative z-10 flex flex-col items-center text-center">
                {/* Step Circle with Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accent} text-white flex items-center justify-center shadow-card mb-5 ring-4 ring-white`}>
                  <Icon className="w-7 h-7" />
                </div>

                <div className="w-full bg-white p-6 rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-card transition-all flex flex-col h-full justify-between">
                  <div>
                    <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
                      <span>STEP {step.stage}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-wide">
                      {step.action}
                    </h3>
                    <h4 className="text-xs font-semibold text-teal-700 mb-2">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile & Tablet Vertical Timeline */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.action}
                className="flex items-start space-x-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded">
                      {step.action}
                    </span>
                    <span className="text-xs text-slate-400">Step {step.stage}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
