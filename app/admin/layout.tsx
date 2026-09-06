'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  Mail,
  Sliders,
  Settings,
  Image,
  Trophy,
  BookOpen,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Layers,
  FileQuestion,
  Bell,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login?callbackUrl=/admin');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated && data.user.role === 'ADMIN') {
          setAdminUser(data.user);
        } else {
          router.push('/login?error=unauthorized_admin');
        }
      })
      .catch(() => router.push('/login?callbackUrl=/admin'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navSections = [
    {
      group: 'Core Control',
      items: [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Student Registrations', href: '/admin/registrations', icon: UserCheck },
        { label: 'School Partnerships', href: '/admin/partnerships', icon: Building2 },
        { label: 'Contact Messages', href: '/admin/messages', icon: Mail },
      ],
    },
    {
      group: 'User Management',
      items: [
        { label: 'Manage Students', href: '/admin/students', icon: Users },
        { label: 'Manage Instructors', href: '/admin/instructors', icon: GraduationCap },
      ],
    },
    {
      group: 'Website CMS & Content',
      items: [
        { label: 'Website CMS & Media', href: '/admin/cms', icon: Sliders },
        { label: 'Faculty Quiz Center', href: '/instructor/quizzes', icon: FileQuestion },
        { label: 'Study Materials', href: '/instructor/materials', icon: BookOpen },
        { label: 'Session Activities', href: '/instructor/activities', icon: Layers },
      ],
    },
    {
      group: 'System Settings',
      items: [
        { label: 'Brand & Site Settings', href: '/admin/settings', icon: Settings },
      ],
    },
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

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-slate-900 text-slate-200 flex flex-col justify-between z-50 transition-transform duration-200 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 flex flex-col h-full overflow-y-auto">
          {/* Brand header */}
          <div className="pb-4 border-b border-slate-800">
            <Link href="/" className="inline-block p-1.5 bg-white rounded-xl shadow-sm">
              <img
                src="/images/logo.png"
                alt="PRAGATHI AI"
                className="h-[68px] sm:h-[76px] w-auto object-contain"
              />
            </Link>
            <div className="mt-2.5 flex items-center space-x-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Admin Control Centre</span>
            </div>
          </div>

          {/* Admin User info */}
          {adminUser && (
            <div className="my-4 p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl">
              <p className="text-xs font-bold text-white truncate">{adminUser.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{adminUser.email}</p>
              <span className="inline-block mt-1 text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                Master Authority
              </span>
            </div>
          )}

          {/* Grouped Navigation */}
          <nav className="space-y-5 flex-grow pt-2">
            {navSections.map((sec) => (
              <div key={sec.group} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {sec.group}
                </p>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-teal-600 text-white font-bold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <Link
              href="/"
              target="_blank"
              className="text-[11px] font-semibold text-slate-400 hover:text-teal-300 transition"
            >
              View Public Site ↗
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
