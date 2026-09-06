'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Video,
  FileQuestion,
  BookOpen,
  Users,
  Plus,
  ArrowRight,
  Bell,
  Sparkles,
} from 'lucide-react';

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState({
    materialsCount: 0,
    videosCount: 0,
    quizzesCount: 0,
    assignmentsCount: 0,
    studentsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/content/materials').then((r) => r.json()),
      fetch('/api/content/videos').then((r) => r.json()),
      fetch('/api/content/quizzes').then((r) => r.json()),
      fetch('/api/content/assignments').then((r) => r.json()),
      fetch('/api/admin/users?role=STUDENT').then((r) => (r.ok ? r.json() : { users: [] })),
    ])
      .then(([mat, vid, qz, asg, stu]) => {
        setStats({
          materialsCount: mat.materials?.length || 0,
          videosCount: vid.videos?.length || 0,
          quizzesCount: qz.quizzes?.length || 0,
          assignmentsCount: asg.assignments?.length || 0,
          studentsCount: stu.users?.length || 0,
        });
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
          Instructor Management Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Create, edit, and organize curriculum content for the PRAGATHI AI Foundation Program.
        </p>
      </div>

      {/* Metrics Row (True statistics, starts clean at 0) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500">Materials</span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{stats.materialsCount}</p>
          <p className="text-[11px] text-teal-700 mt-1">Notes & PDFs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500">Video Lessons</span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{stats.videosCount}</p>
          <p className="text-[11px] text-teal-700 mt-1">YouTube & Drive</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500">Quizzes</span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{stats.quizzesCount}</p>
          <p className="text-[11px] text-teal-700 mt-1">MCQ Challenges</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500">Assignments</span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{stats.assignmentsCount}</p>
          <p className="text-[11px] text-teal-700 mt-1">Active Tasks</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle col-span-2 lg:col-span-1">
          <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{stats.studentsCount}</p>
          <p className="text-[11px] text-teal-700 mt-1">Cohort Members</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <h2 className="text-base font-bold text-slate-900 mb-4">Quick Educational Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/instructor/materials"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Upload Material</p>
              <p className="text-[11px] text-slate-500">PDFs, notes & docs</p>
            </div>
          </Link>

          <Link
            href="/instructor/videos"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Add Video Lesson</p>
              <p className="text-[11px] text-slate-500">YouTube or Drive links</p>
            </div>
          </Link>

          <Link
            href="/instructor/quizzes"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Create Quiz</p>
              <p className="text-[11px] text-slate-500">MCQ assessments</p>
            </div>
          </Link>

          <Link
            href="/instructor/announcements"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-brand-purple flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Post Announcement</p>
              <p className="text-[11px] text-slate-500">Notify student cohorts</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Curriculum Overview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <h2 className="text-base font-bold text-slate-900 mb-2">
          7 Foundation Modules Structure
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Educational content added in this portal automatically associates with the standardized curriculum modules.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { num: 1, title: 'Introduction to Artificial Intelligence' },
            { num: 2, title: 'Types and Applications of AI' },
            { num: 3, title: 'AI Problem Solving & Search Strategies' },
            { num: 4, title: 'Machine Learning' },
            { num: 5, title: 'Deep Learning and Neural Networks' },
            { num: 6, title: 'Generative AI and Modern AI Tools' },
            { num: 7, title: 'AI Ethics, Future and Projects' },
          ].map((m) => (
            <div key={m.num} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-teal-700">Module 0{m.num}</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{m.title}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
