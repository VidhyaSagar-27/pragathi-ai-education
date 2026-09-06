'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  ClipboardList,
  FileQuestion,
  BookOpen,
  UserCheck,
  Mail,
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Image,
  Bell,
  RotateCw,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [data, setData] = useState<{
    stats: {
      totalStudents: number;
      totalInstructors: number;
      totalMaterials: number;
      totalQuizzes: number;
      totalAssignments: number;
      pendingRegistrations: number;
      newMessages: number;
      partnershipRequests: number;
    };
    recentRegistrations: any[];
    recentPartnerships: any[];
    recentMessages: any[];
  }>({
    stats: {
      totalStudents: 0,
      totalInstructors: 0,
      totalMaterials: 0,
      totalQuizzes: 0,
      totalAssignments: 0,
      pendingRegistrations: 0,
      newMessages: 0,
      partnershipRequests: 0,
    },
    recentRegistrations: [],
    recentPartnerships: [],
    recentMessages: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    fetch(`/api/admin/overview?_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        if (res.stats) setData(res);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchOverview();

    const onFocus = () => fetchOverview();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-8">
      
      {/* Title & Authority Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Highest Authority Level</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            PRAGATHI AI Control Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time platform metrics, enrollment moderation, school partnerships, and curriculum control.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs"
            title="Refresh Live Data"
          >
            <RotateCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <Link
            href="/admin/registrations"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm w-fit"
          >
            <UserCheck className="w-4 h-4 text-teal-400" />
            <span>Review Applications ({stats.pendingRegistrations})</span>
          </Link>
        </div>
      </div>

      {/* 8 Real Statistics Cards (Starts at 0, no fake statistics!) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Link href="/admin/students" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:border-teal-500 transition">
          <span className="text-xs font-semibold text-slate-500">Total Students</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalStudents}</p>
          <p className="text-[11px] text-teal-700 mt-1">Active Accounts</p>
        </Link>

        <Link href="/admin/instructors" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:border-teal-500 transition">
          <span className="text-xs font-semibold text-slate-500">Total Instructors</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalInstructors}</p>
          <p className="text-[11px] text-teal-700 mt-1">Faculty Accounts</p>
        </Link>

        <Link href="/instructor/materials" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:border-teal-500 transition">
          <span className="text-xs font-semibold text-slate-500">Total Materials</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalMaterials}</p>
          <p className="text-[11px] text-slate-500 mt-1">Notes & PDFs</p>
        </Link>

        <Link href="/instructor/quizzes" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:border-teal-500 transition">
          <span className="text-xs font-semibold text-slate-500">Total Quizzes</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalQuizzes}</p>
          <p className="text-[11px] text-slate-500 mt-1">Evaluations</p>
        </Link>

        <Link href="/instructor/assignments" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:border-teal-500 transition">
          <span className="text-xs font-semibold text-slate-500">Total Assignments</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalAssignments}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active Tasks</p>
        </Link>

        <Link href="/admin/registrations" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:border-teal-500 transition">
          <span className="text-xs font-semibold text-slate-500">Pending Registrations</span>
          <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pendingRegistrations}</p>
          <p className="text-[11px] text-amber-700 mt-1">Requires Review</p>
        </Link>

        <Link href="/admin/messages" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:border-teal-500 transition">
          <span className="text-xs font-semibold text-slate-500">New Messages</span>
          <p className="text-3xl font-bold text-teal-700 mt-2">{stats.newMessages}</p>
          <p className="text-[11px] text-teal-800 mt-1">Inquiries</p>
        </Link>

        <Link href="/admin/partnerships" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:border-teal-500 transition">
          <span className="text-xs font-semibold text-slate-500">School Inquiries</span>
          <p className="text-3xl font-bold text-indigo-700 mt-2">{stats.partnershipRequests}</p>
          <p className="text-[11px] text-indigo-800 mt-1">Bring to Your School</p>
        </Link>
      </div>

      {/* Admin Quick Actions (Section 35) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <h2 className="text-base font-bold text-slate-900 mb-4">Admin Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/students"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-center space-x-3"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Add Student</p>
              <p className="text-[11px] text-slate-500">Manual provision</p>
            </div>
          </Link>

          <Link
            href="/admin/instructors"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-center space-x-3"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Add Instructor</p>
              <p className="text-[11px] text-slate-500">Faculty permissions</p>
            </div>
          </Link>

          <Link
            href="/instructor/materials"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-center space-x-3"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Upload Material</p>
              <p className="text-[11px] text-slate-500">Notes & PDF files</p>
            </div>
          </Link>

          <Link
            href="/instructor/quizzes"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-center space-x-3"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Create Quiz</p>
              <p className="text-[11px] text-slate-500">MCQ checkpoints</p>
            </div>
          </Link>

          <Link
            href="/instructor/announcements"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-center space-x-3"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-brand-purple flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Add Announcement</p>
              <p className="text-[11px] text-slate-500">Platform notice</p>
            </div>
          </Link>

          <Link
            href="/admin/cms"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-center space-x-3"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Upload Gallery</p>
              <p className="text-[11px] text-slate-500">Photos & videos</p>
            </div>
          </Link>

          <Link
            href="/admin/cms"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-center space-x-3"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Website CMS</p>
              <p className="text-[11px] text-slate-500">Edit hero & text</p>
            </div>
          </Link>

          <Link
            href="/admin/registrations"
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition flex items-center space-x-3"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">View Registrations</p>
              <p className="text-[11px] text-slate-500">Approve / Reject</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Submissions Triage */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Student Applications</h3>
              <Link href="/admin/registrations" className="text-xs font-semibold text-teal-700 hover:underline">
                View all ({data.recentRegistrations.length})
              </Link>
            </div>

            {data.recentRegistrations.length > 0 ? (
              <div className="space-y-3">
                {data.recentRegistrations.slice(0, 4).map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{r.studentName}</p>
                      <p className="text-slate-500">{r.schoolName} • Grade {r.classGrade}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                0 pending applications. All submissions will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Recent School Partnerships */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent School Inquiries</h3>
              <Link href="/admin/partnerships" className="text-xs font-semibold text-teal-700 hover:underline">
                View all ({data.recentPartnerships.length})
              </Link>
            </div>

            {data.recentPartnerships.length > 0 ? (
              <div className="space-y-3">
                {data.recentPartnerships.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{p.schoolName}</p>
                      <p className="text-slate-500">{p.contactPerson} ({p.designation})</p>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-indigo-100 text-indigo-800">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                0 school partnership requests. New requests will appear here.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
