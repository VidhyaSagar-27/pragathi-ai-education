'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Calendar, UserCheck } from 'lucide-react';
import { Announcement } from '@/lib/db/types';

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content/announcements')
      .then((r) => r.json())
      .then((data) => {
        setAnnouncements(data.announcements || []);
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
          Announcements & Updates
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Important program notifications, schedule changes, and event notices from PRAGATHI AI.
        </p>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((anc) => (
            <div
              key={anc.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{anc.title}</h3>
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(anc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="py-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {anc.message}
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Audience: {anc.targetRole}</span>
                <span className="font-medium text-teal-700">Posted by {anc.authorName}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Announcements Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Stay connected for upcoming PRAGATHI AI updates and schedules.
          </p>
        </div>
      )}
    </div>
  );
}
