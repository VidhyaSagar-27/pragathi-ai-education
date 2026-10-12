'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  FileText,
  ChevronRight,
  Settings,
} from 'lucide-react';

interface QuickNavProps {
  title?: string;
  subtitle?: string;
  role?: 'ADMIN' | 'INSTRUCTOR';
  extraActions?: React.ReactNode;
}

export default function QuickNavigationHeader({
  title,
  subtitle,
  role = 'ADMIN',
  extraActions,
}: QuickNavProps) {
  const pathname = usePathname();
  const isAdmin = role === 'ADMIN';

  const navLinks = isAdmin
    ? [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Students', href: '/admin/students', icon: Users },
        { label: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
        { label: 'Fees & Payments', href: '/admin/fees', icon: CreditCard },
        { label: 'Instructors', href: '/admin/instructors', icon: GraduationCap },
        { label: 'Reports', href: '/admin/reports', icon: FileText },
      ]
    : [
        { label: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
        { label: 'Students', href: '/instructor/students', icon: Users },
        { label: 'Attendance', href: '/instructor/attendance', icon: CalendarCheck },
        { label: 'Quizzes', href: '/instructor/quizzes', icon: FileText },
      ];

  const dashboardHref = isAdmin ? '/admin' : '/instructor';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5 mb-6">
      {/* Top Breadcrumb & Back Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link
            href={dashboardHref}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-teal-700 font-bold capitalize">
            {(pathname || '').split('/').pop()?.replace(/-/g, ' ') || 'Control'}
          </span>
        </div>

        {extraActions && (
          <div className="flex items-center space-x-2">
            {extraActions}
          </div>
        )}
      </div>

      {/* Main Page Title & Fast-Jump Navigation Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {title && (
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Navigation Buttons Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
