'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, ExternalLink, Users } from 'lucide-react';
import { Assignment } from '@/lib/db/types';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content/assignments')
      .then((r) => r.json())
      .then((data) => {
        setAssignments(data.assignments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Module Assignments
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review problem briefs, exercise instructions, and submission deadlines.
        </p>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((asg) => (
            <div
              key={asg.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    Module 0{asg.moduleId}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{asg.title}</h3>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 w-fit">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due: {new Date(asg.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="py-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {asg.instructions}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Assigned to: {asg.targetGroup}</span>
                {asg.attachmentUrl && (
                  <a
                    href={asg.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-teal-700 font-semibold hover:text-teal-900"
                  >
                    <span>Download Assignment Brief</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Assignments</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            There are no pending assignments assigned to your cohort at this time.
          </p>
        </div>
      )}
    </div>
  );
}
