'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '';
  const initialError = searchParams?.get('error') || '';

  const roleParam = searchParams?.get('role')?.toUpperCase();
  const initialRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' =
    roleParam === 'ADMIN' || callbackUrl.startsWith('/admin')
      ? 'ADMIN'
      : roleParam === 'INSTRUCTOR'
      ? 'INSTRUCTOR'
      : 'STUDENT';

  const [roleTab, setRoleTab] = useState<'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    initialError === 'unauthorized_admin'
      ? 'Administrator privileges required to view that page.'
      : initialError === 'unauthorized_instructor' && initialRole === 'INSTRUCTOR'
      ? 'Instructor privileges required to view that page.'
      : initialError === 'unauthorized_student' && initialRole === 'STUDENT'
      ? 'Student access required to view that page.'
      : ''
  );

  // Pure role change handler: completely isolates credentials, errors, and UI state
  const handleRoleChange = (newRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN') => {
    if (newRole === roleTab) return;
    setRoleTab(newRole);
    setIdentifier('');
    setPassword('');
    setShowPassword(false);
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role: roleTab,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const userRole = data.user.role;

      // Wipe credentials from React state immediately upon successful sign in
      setIdentifier('');
      setPassword('');

      // Smart role-based destination resolution to prevent redirect loops
      let destination = '/';
      if (userRole === 'ADMIN') {
        if (callbackUrl && (callbackUrl.startsWith('/admin') || callbackUrl.startsWith('/instructor') || callbackUrl.startsWith('/student'))) {
          destination = callbackUrl;
        } else {
          destination = '/admin';
        }
      } else if (userRole === 'INSTRUCTOR') {
        if (callbackUrl && callbackUrl.startsWith('/instructor')) {
          destination = callbackUrl;
        } else {
          destination = '/instructor';
        }
      } else {
        if (callbackUrl && callbackUrl.startsWith('/student')) {
          destination = callbackUrl;
        } else {
          destination = '/student';
        }
      }

      setLoading(false);
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
      setPassword(''); // Wipe sensitive password field on failure
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        {/* Official Brand Logo - Prominent & High Resolution */}
        <Link href="/" className="inline-block p-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 mb-4 hover:shadow transition">
          <img
            src="/images/logo.png"
            alt="PRAGATHI AI"
            className="h-[90px] sm:h-[105px] w-auto object-contain mx-auto"
          />
        </Link>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          PRAGATHI AI Learning Portal
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Sign in to your authorized student, instructor, or administrator portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-elevated rounded-2xl border border-slate-200/90">
          
          {/* Role Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => handleRoleChange('STUDENT')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                roleTab === 'STUDENT'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('INSTRUCTOR')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                roleTab === 'INSTRUCTOR'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
              <span>Instructor</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                roleTab === 'ADMIN'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-purple" />
              <span>Admin</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form - Keyed strictly by roleTab to force a pristine unmount/mount cycle and block browser autofill leakage */}
          <form
            key={roleTab}
            onSubmit={handleLogin}
            className="space-y-4"
            autoComplete="off"
          >
            <div>
              <label
                htmlFor={`login-identifier-${roleTab.toLowerCase()}`}
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id={`login-identifier-${roleTab.toLowerCase()}`}
                  name={`login_identifier_${roleTab.toLowerCase()}`}
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="off"
                  placeholder={
                    roleTab === 'ADMIN'
                      ? 'Administrator email or mobile'
                      : roleTab === 'INSTRUCTOR'
                      ? 'Faculty email or mobile number'
                      : 'Mobile number or student email'
                  }
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`login-password-${roleTab.toLowerCase()}`}
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id={`login-password-${roleTab.toLowerCase()}`}
                  name={`login_password_${roleTab.toLowerCase()}`}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="w-full text-sm pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-navy to-brand-teal hover:from-slate-900 hover:to-teal-600 transition shadow-sm disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : `Sign In as ${roleTab}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Role specific helper notes */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            {roleTab === 'STUDENT' && (
              <p className="text-xs text-slate-500 leading-relaxed">
                New student?{' '}
                <Link href="/register" className="font-bold text-teal-700 hover:text-teal-900 underline">
                  Submit an enrollment registration
                </Link>{' '}
                to receive portal credentials upon administrator approval.
              </p>
            )}

            {roleTab === 'INSTRUCTOR' && (
              <p className="text-xs text-slate-500 leading-relaxed">
                Instructor credentials are provisioned directly by PRAGATHI AI Administrators.
              </p>
            )}

            {roleTab === 'ADMIN' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                <p className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-purple" />
                  <span>Secure Administrator Access</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Administrative access is restricted to authorized personnel only. Please sign in with your registered administrator credentials.
                </p>
              </div>
            )}
          </div>

        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-teal-700 transition">
            ← Return to PRAGATHI AI Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
