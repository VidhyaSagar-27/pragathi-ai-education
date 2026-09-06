'use client';

import React from 'react';
import {
  Users,
  Presentation,
  FlaskConical,
  BrainCircuit,
  TrendingUp,
  Palette,
  HelpCircle,
  Award,
} from 'lucide-react';

export default function WhyPragathiSection() {
  const cards = [
    {
      title: 'Student-Friendly Learning',
      description: 'Complex AI principles translated into intuitive, age-appropriate lessons that make learning enjoyable.',
      icon: Users,
      badge: 'Pedagogy',
    },
    {
      title: 'Interactive Sessions',
      description: 'Engaging real-time discussions, visual demonstrations, and collaborative classroom interactions.',
      icon: Presentation,
      badge: 'Engagement',
    },
    {
      title: 'Practical Activities',
      description: 'Hands-on exercises and guided mini-labs where students test concepts directly on modern platforms.',
      icon: FlaskConical,
      badge: 'Action',
    },
    {
      title: 'AI Awareness',
      description: 'Developing sharp discernment on how artificial intelligence operates in gadgets, apps, and everyday life.',
      icon: BrainCircuit,
      badge: 'Clarity',
    },
    {
      title: 'Future-Ready Skills',
      description: 'Building critical thinking, data literacy, and technical adaptability for 21st-century academic growth.',
      icon: TrendingUp,
      badge: 'Readiness',
    },
    {
      title: 'Creative Learning',
      description: 'Fostering inventive expression through prompt design, digital art, AI storytelling, and ideation.',
      icon: Palette,
      badge: 'Innovation',
    },
    {
      title: 'Quizzes and Challenges',
      description: 'Carefully crafted module checkpoints and problem-solving puzzles that reinforce concept retention.',
      icon: HelpCircle,
      badge: 'Assessment',
    },
    {
      title: 'Performance-Based Recognition',
      description: 'Recognizing student effort, project excellence, and module milestones with verified program credentials.',
      icon: Award,
      badge: 'Milestones',
    },
  ];

  return (
    <section id="program" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-100/70 px-3.5 py-1 rounded-full border border-teal-200 select-none cursor-default">
            The Foundation Advantage
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Why Choose PRAGATHI AI?
          </h2>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            A comprehensive, student-centric framework engineered to transition curious learners into confident digital architects.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group relative bg-white rounded-2xl p-7 border border-slate-200/90 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors duration-200 shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2.5">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-teal-700">
                  <span>Module Pillar 0{idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
