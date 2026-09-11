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
  Zap,
  ShieldCheck,
  Trophy,
  Flame,
  Star,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const [data, setData] = useState<{
    user: any;
    materials: any[];
    videos: any[];
    quizzes: any[];
    submissions: any[];
    announcements: any[];
    certificates: any[];
  }>({
    user: null,
    materials: [],
    videos: [],
    quizzes: [],
    submissions: [],
    announcements: [],
    certificates: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me?t=' + Date.now()).then((r) => r.json()),
      fetch('/api/content/materials?t=' + Date.now()).then((r) => r.json()),
      fetch('/api/content/videos?t=' + Date.now()).then((r) => r.json()),
      fetch('/api/content/quizzes?t=' + Date.now()).then((r) => r.json()),
      fetch('/api/student/submissions?t=' + Date.now()).then((r) => r.json()),
      fetch('/api/content/announcements?t=' + Date.now()).then((r) => r.json()),
      fetch('/api/student/certificates?t=' + Date.now()).then((r) => r.json()).catch(() => ({ certificates: [] })),
    ])
      .then(([me, mat, vid, qz, sub, anc, cert]) => {
        setData({
          user: me.user,
          materials: mat.materials || [],
          videos: vid.videos || [],
          quizzes: qz.quizzes || [],
          submissions: sub.submissions || [],
          announcements: anc.announcements || [],
          certificates: cert.certificates || [],
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
  const passedCount = data.submissions.filter((s) => s.passed).length;
  const averageScore =
    completedCount > 0
      ? Math.round(
          data.submissions.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / completedCount
        )
      : 0;

  const curriculumProgressPercent = Math.min(100, Math.round((passedCount / 7) * 100));

  const badges = [
    {
      id: 'pioneer',
      name: 'AI Pioneer',
      desc: 'Enrolled in Foundation Program',
      icon: Sparkles,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      unlocked: true,
    },
    {
      id: 'quiz_ace',
      name: 'Exam Ace',
      desc: 'Passed first module exam',
      icon: Trophy,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      unlocked: passedCount >= 1,
    },
    {
      id: 'neural_scholar',
      name: 'Neural Scholar',
      desc: 'Achieved 80%+ exam score',
      icon: Star,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      unlocked: averageScore >= 80,
    },
    {
      id: 'certified',
      name: 'Certified Innovator',
      desc: 'Earned official credential',
      icon: Award,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      unlocked: data.certificates.length > 0 || passedCount >= 1,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy via-slate-900 to-teal-900 text-white p-6 sm:p-10 shadow-elevated">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Pragathi AI Foundation Program</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Welcome back, {data.user?.name || 'Student'}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed max-w-2xl">
            You are enrolled in the official 7-module AI curriculum. Track your progress, launch interactive AI simulations, and earn verified certificates.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/student/modules"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore 7 Modules</span>
            </Link>

            <Link
              href="/student/quizzes"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-bold transition border border-white/20"
            >
              <FileQuestion className="w-4 h-4 text-teal-300" />
              <span>Take Assessment</span>
            </Link>

            <Link
              href="/student/playground"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-bold transition border border-white/20"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>AI Playground Lab</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Curriculum Mastery Progress Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Curriculum Mastery Progress
            </h3>
          </div>
          <span className="text-xs font-black text-teal-700 font-mono">
            {passedCount} / 7 Modules Completed ({curriculumProgressPercent}%)
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, curriculumProgressPercent)}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Core Modules</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">7</p>
          <p className="text-[11px] text-teal-700 mt-1 font-semibold">Handwritten Syllabus</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Study Materials</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{data.materials.length}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Notes & Datasets</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Exam Attempts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{completedCount}</p>
          <p className="text-[11px] text-emerald-700 mt-1 font-bold">{passedCount} Passed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Average Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {completedCount > 0 ? `${averageScore}%` : '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Auto-Graded Performance</p>
        </div>
      </div>

      {/* Gamified Achievement Badges */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-slate-900">Student Achievement Badges</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Earn badges as you master AI</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center transition ${
                  b.unlocked ? b.color : 'bg-slate-50 border-slate-200 opacity-45'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/80 shadow-xs flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">{b.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{b.desc}</p>
                <span
                  className={`mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    b.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {b.unlocked ? 'Unlocked' : 'In Progress'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Announcements if any */}
      {data.announcements.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-4">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3>Latest Announcements</h3>
          </div>
          <div className="space-y-3">
            {data.announcements.map((anc) => (
              <div key={anc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-900">{anc.title}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(anc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{anc.message}</p>
                <div className="mt-2 text-[11px] text-teal-700 font-medium">Posted by {anc.authorName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Launch Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">7 Foundation Syllabus Modules</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Browse module topics, learning outcomes, and assigned reading materials.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/student/modules"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              <span>View Curriculum</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
              <FileQuestion className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Interactive Quiz Challenges</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Test your understanding with multi-mode questions, timer, and instant scorecards.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/student/quizzes"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
            >
              <span>Launch Quiz Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Interactive AI Playground</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Simulate neural networks, test prompt sampling temperatures, and explore image convolutions.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/student/playground"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 hover:text-amber-900"
            >
              <span>Open AI Playground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
