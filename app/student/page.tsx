'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileQuestion,
  ClipboardList,
  Video,
  Award,
  Bell,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const [data, setData] = useState<{
    user: any;
    materials: any[];
    videos: any[];
    quizzes: any[];
    submissions: any[];
    announcements: any[];
  }>({
    user: null,
    materials: [],
    videos: [],
    quizzes: [],
    submissions: [],
    announcements: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/content/materials').then((r) => r.json()),
      fetch('/api/content/videos').then((r) => r.json()),
      fetch('/api/content/quizzes').then((r) => r.json()),
      fetch('/api/student/submissions').then((r) => r.json()),
      fetch('/api/content/announcements').then((r) => r.json()),
    ])
      .then(([me, mat, vid, qz, sub, anc]) => {
        setData({
          user: me.user,
          materials: mat.materials || [],
          videos: vid.videos || [],
          quizzes: qz.quizzes || [],
          submissions: sub.submissions || [],
          announcements: anc.announcements || [],
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading student dashboard data', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const completedCount = data.submissions.length;
  const averageScore =
    completedCount > 0
      ? Math.round(
          data.submissions.reduce((acc, curr) => acc + curr.percentage, 0) / completedCount
        )
      : 0;

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy via-slate-900 to-teal-900 text-white p-6 sm:p-8 shadow-elevated">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pragathi AI Foundation Program</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {data.user?.name || 'Student'}!
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Ready to continue your journey through the 7 Foundation Modules? Access your assigned notes, interactive quizzes, and video tutorials below.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/student/modules"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Curriculum</span>
            </Link>
            <Link
              href="/student/quizzes"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              <FileQuestion className="w-4 h-4" />
              <span>Available Quizzes ({data.quizzes.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Core Modules</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">7</p>
          <p className="text-[11px] text-teal-700 mt-1 font-medium">Foundation Curriculum</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Study Materials</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {data.materials.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Available notes & PDFs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Quizzes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {data.quizzes.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{completedCount} Completed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Average Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {completedCount > 0 ? `${averageScore}%` : '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {completedCount > 0 ? 'Quiz evaluations' : 'Complete a quiz to evaluate'}
          </p>
        </div>
      </div>

      {/* Announcements Banner if any */}
      {data.announcements.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-4">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3>Latest Announcements</h3>
          </div>
          <div className="space-y-3">
            {data.announcements.map((anc) => (
              <div key={anc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-900">{anc.title}</h4>
                  <span className="text-[11px] text-slate-400">
                    {new Date(anc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{anc.message}</p>
                <div className="mt-2 text-[11px] text-teal-700 font-medium">Posted by {anc.authorName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Launch Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">7 Foundation Syllabus Modules</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse module topics, learning outcomes, and assigned reading materials.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/student/modules"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              <span>View Curriculum</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
              <FileQuestion className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Interactive Quiz Challenges</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Test your understanding with multiple-choice questions, live timer, and auto-evaluation.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/student/quizzes"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              <span>Launch Quiz Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
