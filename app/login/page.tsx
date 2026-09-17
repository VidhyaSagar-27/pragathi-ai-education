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
  HelpCircle,
  CheckCircle2,
  Phone,
  Key,
  Send,
  X,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '';
  const initialError = searchParams?.get('error') || '';

  const emailParam = searchParams?.get('email') || searchParams?.get('identifier') || searchParams?.get('phone') || '';
  const passwordParam = searchParams?.get('password') || searchParams?.get('pwd') || '';

  const roleParam = searchParams?.get('role')?.toUpperCase();
  const initialRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' =
    roleParam === 'ADMIN' || callbackUrl.startsWith('/admin')
      ? 'ADMIN'
      : roleParam === 'INSTRUCTOR' || callbackUrl.startsWith('/instructor')
      ? 'INSTRUCTOR'
      : roleParam === 'STUDENT' || callbackUrl.startsWith('/student')
      ? 'STUDENT'
      : emailParam.toLowerCase().includes('admin')
      ? 'ADMIN'
      : emailParam.toLowerCase().includes('instructor')
      ? 'INSTRUCTOR'
      : 'STUDENT';

  const [roleTab, setRoleTab] = useState<'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>(initialRole);
  const [identifier, setIdentifier] = useState(emailParam);
  const [password, setPassword] = useState(passwordParam);
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

  // Help / Credential Request Modal State
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpName, setHelpName] = useState('');
  const [helpPhone, setHelpPhone] = useState('');
  const [helpEmail, setHelpEmail] = useState('');
  const [helpRole, setHelpRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'APPLICANT'>('STUDENT');
  const [helpType, setHelpType] = useState<
    'PASSWORD_RESET' | 'USER_ID_REQUEST' | 'CREDENTIALS_REQUEST' | 'GENERAL_HELP'
  >('PASSWORD_RESET');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpSuccess, setHelpSuccess] = useState<string | null>(null);
  const [helpError, setHelpError] = useState<string | null>(null);

  const handleOpenHelpModal = () => {
    setHelpRole(roleTab === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT');
    if (identifier.includes('@')) {
      setHelpEmail(identifier);
    } else if (identifier.replace(/\D/g, '').length >= 10) {
      setHelpPhone(identifier);
    }
    setHelpSuccess(null);
    setHelpError(null);
    setHelpModalOpen(true);
  };

  const handleSubmitHelpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setHelpSubmitting(true);
    setHelpError(null);
    setHelpSuccess(null);

    try {
      const res = await fetch('/api/support/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName: helpName,
          requesterRole: helpRole,
          requesterPhone: helpPhone,
          requesterEmail: helpEmail,
          type: helpType,
          subject: `${helpRole} Request: ${helpType.replace(/_/g, ' ')}`,
          message: helpMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setHelpSuccess(
        data.message ||
          'Your request has been delivered to PRAGATHI AI administrators. We will send credentials to your registered WhatsApp & Email.'
      );
    } catch (err: any) {
      setHelpError(err.message || 'Error submitting request. Please try again.');
    } finally {
      setHelpSubmitting(false);
    }
  };

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

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Can't sign in?</span>
              <button
                type="button"
                onClick={handleOpenHelpModal}
                className="font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer flex items-center space-x-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Forgot Password or User ID?</span>
              </button>
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
              <div className="space-y-2">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Approved student?{' '}
                  <Link href="/register?tab=status" className="font-bold text-teal-700 hover:text-teal-900 underline">
                    Check approval status & get your password
                  </Link>
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  New student?{' '}
                  <Link href="/register" className="font-semibold text-slate-700 hover:text-teal-900 underline">
                    Submit an enrollment registration
                  </Link>
                </p>
              </div>
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

      {/* Help & Credential Request Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  PRAGATHI AI Helpdesk
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Request Credentials or Assistance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {helpSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-2">
                  <div className="font-bold text-sm flex items-center space-x-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Request Submitted Successfully!</span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-900">
                    {helpSuccess}
                  </p>
                  <p className="text-[11px] text-emerald-700 pt-1">
                    The administration will dispatch your credentials directly to your WhatsApp mobile number and email address shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(false)}
                  className="w-full py-2.5 bg-brand-navy hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitHelpRequest} className="space-y-3.5">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Lost your password or student ID? Submit your registered phone or email, and the admin team will dispatch your access credentials via WhatsApp & Email.
                </p>

                {helpError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{helpError}</span>
                  </div>
                )}

                {/* Role selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    I am a *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['STUDENT', 'INSTRUCTOR', 'APPLICANT'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setHelpRole(r)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          helpRole === r
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={helpName}
                    onChange={(e) => setHelpName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Registered Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered WhatsApp Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      value={helpPhone}
                      onChange={(e) => setHelpPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full text-xs sm:text-sm pl-12 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={helpEmail}
                    onChange={(e) => setHelpEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Request Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    What do you need? *
                  </label>
                  <select
                    value={helpType}
                    onChange={(e) => setHelpType(e.target.value as any)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="PASSWORD_RESET">Reset My Password</option>
                    <option value="USER_ID_REQUEST">Send My Student / User ID</option>
                    <option value="CREDENTIALS_REQUEST">Send Both User ID & Password</option>
                    <option value="GENERAL_HELP">Cannot Sign In / General Assistance</option>
                  </select>
                </div>

                {/* Additional Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes for Administrator (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="Any extra details e.g. class, school, or error message..."
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setHelpModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={helpSubmitting}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{helpSubmitting ? 'Submitting...' : 'Submit Request to Admin'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
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
