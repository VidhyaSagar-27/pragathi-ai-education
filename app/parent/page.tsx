'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Users,
  Plus,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  School,
  AlertCircle,
  Search,
} from 'lucide-react';

function ParentDashboardContent() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams?.get('phone') || searchParams?.get('identifier') || '';

  const [identifier, setIdentifier] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [familyData, setFamilyData] = useState<{
    family: any;
    children: any[];
    totalChildren: number;
  } | null>(null);
  const [error, setError] = useState('');

  // Add child modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submittingChild, setSubmittingChild] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [childForm, setChildForm] = useState({
    studentName: '',
    classGrade: '8',
    schoolName: '',
    location: '',
  });

  // Password visibility & copied state per student
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePwId, setVisiblePwId] = useState<string | null>(null);

  const fetchFamily = async (queryPhone?: string) => {
    const q = (queryPhone || identifier).trim();
    if (!q) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/parent/children?identifier=${encodeURIComponent(q)}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No family account found.');
      }
      setFamilyData(data);
    } catch (err: any) {
      setError(err.message || 'Could not load family dashboard.');
      setFamilyData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPhone) {
      fetchFamily(initialPhone);
    }
  }, [initialPhone]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyData?.family?.id) return;

    setSubmittingChild(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await fetch('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: familyData.family.id,
          studentName: childForm.studentName,
          classGrade: childForm.classGrade,
          schoolName: childForm.schoolName,
          location: childForm.location || 'Hyderabad',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add child.');

      setModalSuccess(data.message || 'Child added successfully!');
      setChildForm({
        studentName: '',
        classGrade: '8',
        schoolName: '',
        location: '',
      });

      // Reload family data
      setTimeout(() => {
        setModalOpen(false);
        setModalSuccess('');
        fetchFamily(familyData.family.parentPhones?.[0] || identifier);
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || 'An error occurred while adding child.');
    } finally {
      setSubmittingChild(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
              <Users className="w-4 h-4 text-teal-400" />
              <span>Pragathi AI • Family Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Parent & Family Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Manage all your children&apos;s AI learning journeys under one unified family account. View credentials, check enrollment approval, and easily add siblings to your family.
            </p>
          </div>
        </div>

        {/* Lookup / Authentication Card if no family selected */}
        {!familyData && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md max-w-xl mx-auto space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
              <Users className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">Access Your Family Account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the parent mobile number or email address registered during student enrollment.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchFamily();
              }}
              className="space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Mobile Phone or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or parent@gmail.com"
                    className="w-full text-sm pl-4 pr-32 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loading || !identifier.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{loading ? 'Searching...' : 'Open Family'}</span>
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start space-x-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Record Not Found</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Don&apos;t have an account yet?</span>
              <Link href="/register" className="font-bold text-teal-700 hover:underline">
                Register First Child →
              </Link>
            </div>
          </div>
        )}

        {/* Family Loaded View */}
        {familyData && (
          <div className="space-y-8 animate-in fade-in">
            {/* Family Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-xl font-black text-slate-900">{familyData.family.familyName}</h2>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {familyData.family.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Parent / Guardian: <strong className="text-slate-800">{familyData.family.parentName}</strong>
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                  {familyData.family.parentPhones?.map((phone: string, i: number) => (
                    <span key={i} className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      <strong className="font-mono">{phone}</strong>
                    </span>
                  ))}
                  {familyData.family.parentEmails?.map((email: string, i: number) => (
                    <span key={i} className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-teal-600" />
                      <span>{email}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Child</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFamilyData(null)}
                  className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="Switch Family"
                >
                  Switch
                </button>
              </div>
            </div>

            {/* My Children Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <span>My Children</span>
                  <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                    {familyData.children.length}
                  </span>
                </h3>
                <span className="text-xs text-slate-500">
                  Separate credentials and progress for each child
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {familyData.children.map((child: any) => {
                  const isApproved = child.status === 'APPROVED';
                  const showPw = visiblePwId === child.id;

                  return (
                    <div
                      key={child.id}
                      className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-subtle space-y-5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-black text-slate-900">{child.name}</h4>
                              <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                                {child.studentCode || 'STU'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Grade {child.classGrade} • {child.schoolName}
                            </p>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : child.duplicateStatus === 'POSSIBLE_DUPLICATE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {child.duplicateStatus === 'POSSIBLE_DUPLICATE'
                              ? 'UNDER VERIFICATION'
                              : child.status}
                          </span>
                        </div>

                        {/* Credentials box if approved */}
                        {isApproved ? (
                          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1">
                              <Key className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Student Login Credentials</span>
                            </span>

                            <div className="space-y-2 text-xs">
                              {/* Email */}
                              <div>
                                <span className="block text-[10px] text-slate-500 font-medium">Login Email:</span>
                                <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                                  <span className="font-mono font-bold text-slate-800 truncate">
                                    {child.loginEmail}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(child.loginEmail, `email_${child.id}`)}
                                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 ml-2"
                                  >
                                    {copiedId === `email_${child.id}` ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                              </div>

                              {/* Password */}
                              <div>
                                <span className="block text-[10px] text-slate-500 font-medium">Password:</span>
                                <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                                  <span className="font-mono font-bold text-slate-800">
                                    {showPw ? child.temporaryPassword || 'Pragathi2026!' : '••••••••••••'}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => setVisiblePwId(showPw ? null : child.id)}
                                      className="text-slate-400 hover:text-slate-700 text-xs"
                                    >
                                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(child.temporaryPassword || 'Pragathi2026!', `pw_${child.id}`)}
                                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900"
                                    >
                                      {copiedId === `pw_${child.id}` ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Application Pending Approval</p>
                              <p className="mt-0.5 text-amber-800 leading-relaxed">
                                Once accepted by school administration, login credentials will appear here and arrive via SMS & WhatsApp.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Launch Button */}
                      <div className="pt-2">
                        {isApproved ? (
                          <a
                            href={`/login?email=${encodeURIComponent(child.loginEmail)}&role=STUDENT`}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
                          >
                            <Sparkles className="w-4 h-4 text-emerald-200" />
                            <span>Launch Portal as {child.name}</span>
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        ) : (
                          <Link
                            href={`/register?tab=status&identifier=${encodeURIComponent(familyData.family.parentPhones?.[0] || identifier)}`}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                          >
                            <span>Check Review Status</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: + Add Another Child */}
        {modalOpen && familyData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Add Another Child</h3>
                    <p className="text-[11px] text-slate-500">Links directly to {familyData.family.familyName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {modalSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-sm">Child Added Successfully!</p>
                  <p>{modalSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleAddChildSubmit} className="space-y-4">
                  {modalError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                      {modalError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Child Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={childForm.studentName}
                      onChange={(e) => setChildForm({ ...childForm, studentName: e.target.value })}
                      placeholder="e.g. Priya Kumar"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Class / Grade *
                      </label>
                      <select
                        required
                        value={childForm.classGrade}
                        onChange={(e) => setChildForm({ ...childForm, classGrade: e.target.value })}
                        className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                      >
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        City / Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={childForm.location}
                        onChange={(e) => setChildForm({ ...childForm, location: e.target.value })}
                        placeholder="e.g. Hyderabad"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={childForm.schoolName}
                      onChange={(e) => setChildForm({ ...childForm, schoolName: e.target.value })}
                      placeholder="e.g. Narayana High School"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900 space-y-1">
                    <p className="font-bold flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                      <span>Linked Parent Details</span>
                    </p>
                    <p className="text-[11px] text-teal-800">
                      Parent: <strong>{familyData.family.parentName}</strong> • Phone:{' '}
                      <strong>{familyData.family.parentPhones?.[0]}</strong>
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingChild}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      {submittingChild ? 'Adding Sibling...' : 'Register Sibling'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ParentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      }
    >
      <ParentDashboardContent />
    </Suspense>
  );
}
