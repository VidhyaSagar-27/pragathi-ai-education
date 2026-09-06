'use client';

import React from 'react';
import { AchievementItem } from '@/lib/db/types';
import { Trophy, Award, Medal, CheckCircle2, Calendar } from 'lucide-react';

interface AchievementsProps {
  achievements?: AchievementItem[];
}

export default function AchievementsSection({ achievements = [] }: AchievementsProps) {
  return (
    <section id="achievements" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-100/60 px-3.5 py-1 rounded-full border border-teal-200 select-none cursor-default">
            Milestones & Excellence
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            PRAGATHI AI Achievements
          </h2>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            Recognizing genuine accomplishments, student excellence, school milestones, and innovation recognitions.
          </p>
        </div>

        {achievements.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                      {item.category}
                    </span>
                    <div className="flex items-center text-xs text-slate-400 space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center mb-4">
                    <Trophy className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-teal-700 space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Verified PRAGATHI AI Milestone</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center max-w-2xl mx-auto border border-dashed border-slate-300 shadow-subtle">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 border border-amber-100 shadow-sm">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              PRAGATHI AI Achievements Coming Soon
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Student competition recognitions, partner school honors, and program milestones will be published here upon official validation.
            </p>
            <div className="mt-6 inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <Medal className="w-4 h-4 text-amber-500" />
              <span>Strict authentic verification policy</span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
