'use client';

import React, { useState } from 'react';
import { ActivityItem } from '@/lib/db/types';
import {
  Sparkles,
  Layers,
  MessageSquare,
  Compass,
  Puzzle,
  Palette,
  FolderGit2,
  HelpCircle,
  Calendar,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface ActivitiesProps {
  activities?: ActivityItem[];
}

const CATEGORIES = [
  'All Activities',
  'AI Awareness Activities',
  'Interactive Learning Activities',
  'Group Discussions',
  'AI Tool Exploration',
  'Problem-Solving Activities',
  'Creative AI Activities',
  'Student Projects',
  'Quiz Challenges',
];

export default function ActivitiesSection({ activities = [] }: ActivitiesProps) {
  const [activeCategory, setActiveCategory] = useState('All Activities');

  const filtered = activities.filter((act) => {
    if (activeCategory === 'All Activities') return true;
    return act.category.toLowerCase().includes(activeCategory.toLowerCase().replace(' activities', ''));
  });

  return (
    <section id="activities" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-100/60 px-3.5 py-1 rounded-full border border-teal-200 select-none cursor-default">
            Experiential Learning
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            PRAGATHI AI Activities & Labs
          </h2>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            Curated hands-on experiences, algorithmic problem-solving tasks, and collaborative team challenges.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 gap-2 no-scrollbar mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Activities List or Professional Empty State */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {item.learningOutcomes && (
                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Outcome:</span> {item.learningOutcomes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center max-w-2xl mx-auto border border-dashed border-slate-300 shadow-subtle">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              PRAGATHI AI Activities Coming Soon
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Real classroom activities, team hackathons, and challenge briefs will be published here as session schedules are released.
            </p>
            <div className="mt-6 inline-flex items-center space-x-2 text-xs font-semibold text-teal-800 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Session schedules updated by authorized instructors</span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
