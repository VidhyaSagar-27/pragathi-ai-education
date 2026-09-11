'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send,
  UserCheck,
  School,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Award,
  Search,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  MessageSquare,
} from 'lucide-react';

function RegisterContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') === 'status' ? 'status' : 'register';

  const [activeTab, setActiveTab] = useState<'register' | 'status'>(initialTab);

  // Registration Form State
  const [formData, setFormData] = useState({
    studentName: '',
    classGrade: '',
    schoolName: '',
    parentName: '',
    mobileNumber: '',
    email: '',
    location: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedMobile, setSubmittedMobile] = useState('');

  // Status Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    const query = searchParams?.get('q') || searchParams?.get('identifier') || searchParams?.get('mobile');
    if (tab === 'status' || query) {
      setActiveTab('status');
      if (query) {
        setLookupQuery(query);
        handleLookup(undefined, query);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit student registration.');
      }

      setSubmittedName(formData.studentName);
      setSubmittedMobile(formData.mobileNumber);
      setStatus('success');
      setSuccessMessage(data.message);
      setFormData({
        studentName: '',
        classGrade: '',
        schoolName: '',
        parentName: '',
        mobileNumber: '',
        email: '',
        location: '',
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during submission.');
    }
  };

  const handleLookup = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || lookupQuery).trim();
    if (!query) return;

    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await fetch(
        `/api/student/application-status?identifier=${encodeURIComponent(query)}&_t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No application found for this mobile number or email.');
      }

      setLookupResult(data);
    } catch (err: any) {
      setLookupError(err.message || 'Could not verify application status.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCopy = (text: string, type: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleInstantAccess = async () => {
    if (!lookupResult?.student) return;
    setAutoLoggingIn(true);
    try {
      const res = await fetch('/api/student/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: lookupResult.student.mobileNumber || lookupResult.student.loginEmail,
          password: lookupResult.student.temporaryPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = data.redirectUrl || '/student';
      } else {
        window.location.href = `/login?email=${encodeURIComponent(lookupResult.student.loginEmail || '')}&role=STUDENT`;
      }
    } catch {
      window.location.href = `/login?email=${encodeURIComponent(lookupResult.student.loginEmail || '')}&role=STUDENT`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 w-full">
        {/* Navigation Tabs between Enrollment and Status Lookup */}
        <div className="flex rounded-2xl bg-slate-200/80 p-1.5 max-w-xl mx-auto mb-8 shadow-inner border border-slate-300/60">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>New Student Enrollment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4 text-teal-600" />
            <span>Check Status & Get Password</span>
          </button>
        </div>

        {/* TAB 1: NEW STUDENT ENROLLMENT */}
        {activeTab === 'register' && (
          <>
            {status === 'success' ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-emerald-400 shadow-xl max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    Application Received
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    Enrollment Submitted!
                  </h2>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    Thank you, <strong>{submittedName}</strong>. Your enrollment registration has been submitted to PRAGATHI AI administrators for review.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 space-y-2">
                  <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>How to retrieve your login credentials:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    <li>Administrators will review and approve your application.</li>
                    <li>
                      Once approved, an <strong>SMS and WhatsApp notification</strong> with your Login Email and Password will be sent to <strong>{submittedMobile}</strong>.
                    </li>
                    <li>
                      You can also click the <strong>&quot;Check Status & Get Password&quot;</strong> tab above at any time to view your credentials instantly.
                    </li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setActiveTab('status');
                      setLookupQuery(submittedMobile);
                      handleLookup(undefined, submittedMobile);
                    }}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Check Application Status & Password</span>
                  </button>

                  <Link
                    href="/curriculum"
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center justify-center space-x-2"
                  >
                    <span>Explore 7-Module Curriculum</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/"
                    className="px-4 py-3 text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-semibold transition flex items-center justify-center"
                  >
                    <span>Return to Home</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-teal-900 text-white p-6 sm:p-8">
                  <div className="flex items-center space-x-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Official Student Registration</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Enroll in PRAGATHI AI
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    Join India&apos;s premier school AI education platform. Fill out the application below to begin your journey through all 7 curriculum modules, hands-on labs, and certification.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                  {status === 'error' && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Submission Error</p>
                        <p className="text-rose-700 mt-0.5">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Student Name & Grade */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Class / Grade *
                      </label>
                      <select
                        required
                        value={formData.classGrade}
                        onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                      >
                        <option value="">Select Grade</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                  </div>

                  {/* School Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="e.g. Delhi Public School / Narayana High School"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Parent Name & Phone */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Parent / Guardian Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Phone Number (10 Digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        placeholder="e.g. 9876543210"
                        maxLength={10}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  {/* Email & Location */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@example.com"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        City / Town / Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Hyderabad / Bangalore"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Information Note */}
                  <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      <span>Direct WhatsApp & SMS Notification</span>
                    </p>
                    <p className="text-teal-800">
                      Upon administrative approval, your assigned login email and password will be generated and delivered straight to your registered mobile number via WhatsApp and SMS.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full py-3.5 px-6 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{status === 'loading' ? 'Submitting Application...' : 'Submit Student Application'}</span>
                    </button>
                  </div>

                  {/* Login Link */}
                  <div className="text-center pt-2 flex items-center justify-center space-x-4 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setActiveTab('status')}
                      className="font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      Check application status & credentials →
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* TAB 2: CHECK APPLICATION STATUS & CREDENTIALS RETRIEVAL */}
        {activeTab === 'status' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-teal-950 text-white p-6 sm:p-8">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
                <Key className="w-4 h-4 text-teal-400" />
                <span>Self-Service Student Lookup</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Check Status & Get Password
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Registered for PRAGATHI AI? Enter your 10-digit mobile number or email below to check your approval status and retrieve your login credentials immediately.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Lookup Search Input */}
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Mobile Number or Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      placeholder="e.g. 9876543210 or your email"
                      className="w-full text-sm pl-4 pr-32 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={lookupLoading || !lookupQuery.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{lookupLoading ? 'Checking...' : 'Check Status'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Error Message */}
              {lookupError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Record Not Found</p>
                    <p className="text-rose-700 leading-relaxed">{lookupError}</p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="text-xs font-bold text-teal-700 underline hover:text-teal-900 cursor-pointer"
                      >
                        Click here to submit an enrollment registration
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Result State 1: APPROVED (Displays Credentials with Copy & Login button) */}
              {lookupResult && lookupResult.status === 'APPROVED' && (
                <div className="bg-emerald-50/60 border-2 border-emerald-400 rounded-3xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full tracking-wider">
                          Application Approved
                        </span>
                        <h2 className="text-xl font-black text-slate-900 mt-1">
                          {lookupResult.student?.name}
                        </h2>
                        <p className="text-xs text-slate-600">
                          {lookupResult.student?.schoolName} • Grade {lookupResult.student?.classGrade}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="bg-white rounded-2xl p-5 border border-emerald-300 shadow-sm space-y-4">
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>Your Official Login Credentials</span>
                    </p>

                    {/* Email / ID */}
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1">
                        Login Email / Student ID
                      </span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={lookupResult.student?.loginEmail || ''}
                          className="flex-grow font-mono text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(lookupResult.student?.loginEmail || '', 'email')}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                          title="Copy Email"
                        >
                          {copiedEmail ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1">
                        Password
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-grow">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            readOnly
                            value={lookupResult.student?.temporaryPassword || 'Pragathi2026!'}
                            className="w-full font-mono text-sm pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 select-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(lookupResult.student?.temporaryPassword || 'Pragathi2026!', 'password')
                          }
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                          title="Copy Password"
                        >
                          {copiedPassword ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Please save this password securely. You can change it at any time in your student profile settings.
                      </p>
                    </div>
                  </div>

                  {/* Notification Alert Info */}
                  <div className="p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Notification Dispatched</p>
                      <p className="text-emerald-800 mt-0.5 leading-relaxed">
                        These login credentials have also been dispatched to your WhatsApp and SMS on{' '}
                        <strong>+91 {lookupResult.student?.mobileNumber}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleInstantAccess}
                      disabled={autoLoggingIn}
                      className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-brand-navy hover:from-emerald-700 hover:to-slate-900 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>{autoLoggingIn ? 'Entering Student Portal...' : 'Instant 1-Click Launch Student Portal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/login?email=${encodeURIComponent(lookupResult.student?.loginEmail || '')}&role=STUDENT`}
                      className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-1.5"
                    >
                      <span>Standard Portal Login</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Result State 2: PENDING (Application under review) */}
              {lookupResult && lookupResult.status === 'PENDING' && (
                <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-6 sm:p-7 space-y-4 animate-in fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold">
                      <Clock className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-full tracking-wider">
                        Under Administrative Review
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">
                        {lookupResult.student?.name}
                      </h2>
                      <p className="text-xs text-slate-600">
                        {lookupResult.student?.schoolName} • Grade {lookupResult.student?.classGrade}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-amber-950 leading-relaxed bg-white p-4 rounded-2xl border border-amber-200">
                    {lookupResult.message ||
                      'Your registration application is currently under review by PRAGATHI AI administrators. Once accepted, your login credentials will be displayed here immediately and sent via WhatsApp/SMS.'}
                  </p>

                  <div className="text-xs text-slate-500">
                    Submitted on: {new Date(lookupResult.student?.createdAt).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Result State 3: REJECTED */}
              {lookupResult && lookupResult.status === 'REJECTED' && (
                <div className="bg-rose-50/70 border-2 border-rose-300 rounded-3xl p-6 sm:p-7 space-y-4 animate-in fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-rose-100 text-rose-800 rounded-2xl flex items-center justify-center font-bold">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase px-2.5 py-0.5 bg-rose-200 text-rose-900 rounded-full tracking-wider">
                        Application Not Approved
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">
                        {lookupResult.student?.name}
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-rose-950 leading-relaxed bg-white p-4 rounded-2xl border border-rose-200">
                    {lookupResult.notes ||
                      'Your registration could not be approved at this time. Please contact school administration or submit a new registration.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    Submit New Application
                  </button>
                </div>
              )}

              {/* Quick instructions / Help */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Need help? Contact support at{' '}
                  <a href="mailto:support@pragathiai.com" className="font-semibold text-teal-700 underline">
                    support@pragathiai.com
                  </a>{' '}
                  or call +91 9618611522.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
