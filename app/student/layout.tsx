'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  ClipboardList,
  FileQuestion,
  Bell,
  Award,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [studentUser, setStudentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchNotifications = () => {
    fetch('/api/student/notifications?_t=' + Date.now())
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setNotifications(d.notifications || []);
          setUnreadCount(d.unreadCount || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated && (data.user.role === 'STUDENT' || data.user.role === 'ADMIN')) {
          setStudentUser(data.user);
          fetchNotifications();
        } else if (data?.authenticated && data.user.role !== 'STUDENT') {
          router.push('/instructor');
        }
      })
      .catch(() => router.push('/login'));

    // Register Service Worker for Web Push if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, [router]);

  const handleMarkAllAsRead = async () => {
    await fetch('/api/student/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllAsRead: true }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Overview', href: '/student', icon: LayoutDashboard },
    { label: 'Modules & Syllabus', href: '/student/modules', icon: BookOpen },
    { label: 'Study Materials', href: '/student/materials', icon: ClipboardList },
    { label: 'Video Lessons', href: '/student/videos', icon: Video },
    { label: 'Quizzes & Challenges', href: '/student/quizzes', icon: FileQuestion },
    { label: 'Assignments', href: '/student/assignments', icon: ClipboardList },
    { label: 'AI Playground', href: '/student/playground', icon: Sparkles },
    { label: 'Announcements', href: '/student/announcements', icon: Bell },
    { label: 'Certificates', href: '/student/certificates', icon: Award },
    { label: 'My Profile', href: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/images/logo.png" alt="PRAGATHI AI" className="h-[52px] w-auto object-contain" />
        </Link>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 text-slate-600 rounded-lg hover:bg-slate-100"
        >
          {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between z-50 transition-transform duration-200 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 flex flex-col h-full overflow-y-auto">
          {/* Logo */}
          <div className="pb-4 border-b border-slate-100">
            <Link href="/" className="inline-block p-1 bg-white rounded-xl shadow-xs">
              <img
                src="/images/logo.png"
                alt="PRAGATHI AI"
                className="h-[68px] sm:h-[76px] w-auto object-contain"
              />
            </Link>
            <div className="mt-2 text-[11px] font-bold tracking-wider text-teal-700 uppercase">
              Student Learning Portal
            </div>
          </div>

          {/* Student Profile snippet with official Student ID */}
          {studentUser && (
            <div className="my-3 p-3 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-900 truncate">{studentUser.name}</p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="p-1 text-teal-800 hover:text-teal-950 rounded-lg hover:bg-teal-100 transition relative cursor-pointer"
                    title="In-App Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-teal-800 font-medium truncate">
                {studentUser.studentDetails?.schoolName || 'Foundation Program'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {studentUser.studentDetails?.studentId ? (
                  <span className="text-[10px] font-black font-mono bg-teal-800 text-white px-2 py-0.5 rounded-md shadow-2xs">
                    {studentUser.studentDetails.studentId}
                  </span>
                ) : null}
                <span className="text-[10px] font-bold bg-white text-slate-700 border border-teal-200 px-1.5 py-0.5 rounded">
                  Grade {studentUser.studentDetails?.classGrade || 'Student'}
                  {studentUser.studentDetails?.section ? ` • Sec ${studentUser.studentDetails.section}` : ''}
                </span>
              </div>

              {/* In-App Notifications Dropdown */}
              {notifOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 space-y-2 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Notifications ({unreadCount} new)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-teal-700 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No notifications yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2 rounded-xl text-xs space-y-0.5 ${
                            n.isRead ? 'bg-slate-50 text-slate-600' : 'bg-teal-50/70 text-slate-900 border border-teal-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px]">{n.title}</span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-700">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1 flex-grow">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout & Footer */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
