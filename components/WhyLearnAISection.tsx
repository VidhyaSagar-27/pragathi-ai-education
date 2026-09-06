'use client';

import React from 'react';
import {
  Brain,
  Puzzle,
  Lightbulb,
  Briefcase,
  Globe2,
  Atom,
  CheckCircle2,
} from 'lucide-react';

export default function WhyLearnAISection() {
  const cards = [
    {
      title: 'Understand AI',
      description: 'Demystify smart assistants, recommendations, and search engines by grasping how models learn from data.',
      icon: Brain,
      color: 'bg-teal-50 text-teal-700 border-teal-100',
    },
    {
      title: 'Improve Problem-Solving',
      description: 'Strengthen decomposition, algorithmic reasoning, pattern recognition, and systematic step-by-step logic.',
      icon: Puzzle,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    },
    {
      title: 'Encourage Creativity',
      description: 'Unleash imagination through creative generation, digital design, and intelligent creative workflows.',
      icon: Lightbulb,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      title: 'Prepare for Future Careers',
      description: 'Gain literacy for high-growth sectors where AI collaboration is becoming the foundational prerequisite.',
      icon: Briefcase,
      color: 'bg-sky-50 text-sky-700 border-sky-100',
    },
    {
      title: 'Discover AI Around Us',
      description: 'Recognize the pervasive footprint of intelligent systems in healthcare, climate, navigation, and entertainment.',
      icon: Globe2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: 'Explore Future Technologies',
      description: 'Develop informed perspectives on robotics, neural interfaces, generative models, and responsible innovation.',
      icon: Atom,
      color: 'bg-purple-50 text-brand-purple border-purple-100',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-100 select-none cursor-default">
            Empowering The Next Generation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Why Learn Artificial Intelligence?
          </h2>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            AI is no longer an elective topic for specialists—it is the foundational literacy shaping every future career and discipline.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-subtle hover:shadow-card hover:bg-white transition-all duration-200"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-6 shadow-sm ${item.color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {item.description}
                </p>
                <div className="flex items-center text-xs font-semibold text-teal-700 space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Integrated into Foundation Curriculum</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
