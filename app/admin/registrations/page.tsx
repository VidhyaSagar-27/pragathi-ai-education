'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  Trash2,
  Copy,
  Check,
  Send,
  Users,
  ShieldCheck,
  Layers,
  Filter,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Mail,
  Phone,
  Sparkles,
  Info,
} from 'lucide-react';
import { StudentRegistration, DuplicateMatchInfo } from '@/lib/db/types';

type FilterTab = 'ALL' | 'PENDING' | 'NEEDS_REVIEW' | 'ACCEPTED' | 'REJECTED';

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    needsReview: number;
    accepted: number;
    rejected: number;
  }>({ total: 0, pending: 0, needsReview: 0, accepted: 0, rejected: 0 });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [compareModalReg, setCompareModalReg] = useState<StudentRegistration | null>(null);
  const [detailsModalReg, setDetailsModalReg] = useState<StudentRegistration | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [acceptanceResult, setAcceptanceResult] = useState<{
    studentName: string;
    studentId: string;
    loginEmail: string;
    temporaryPassword: string;
    automation?: Record<string, any>;
  } | null>(null);

  const loadRegistrations = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/registrations?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.registrations) {
        setRegistrations(data.registrations);
        if (data.stats) {
          setStats(data.stats);
        } else {
          setStats({
            total: data.registrations.length,
            pending: data.registrations.filter((r: any) => r.status === 'PENDING').length,
            needsReview: data.registrations.filter((r: any) => r.status === 'NEEDS_REVIEW').length,
            accepted: data.registrations.filter((r: any) => r.status === 'ACCEPTED' || r.status === 'APPROVED').length,
            rejected: data.registrations.filter((r: any) => r.status === 'REJECTED').length,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Execute single action: ACCEPT, ACCEPT_AS_SIBLING, REJECT, NEEDS_REVIEW
  const executeAction = async (
    regId: string,
    action: 'ACCEPT' | 'ACCEPT_AS_SIBLING' | 'REJECT' | 'NEEDS_REVIEW' | 'MARK_PENDING',
    notes?: string
  ) => {
    setActionLoadingId(regId);
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regId, action, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to perform action ${action}`);
      }

      if (action === 'ACCEPT' || action === 'ACCEPT_AS_SIBLING') {
        const targetReg = registrations.find((r) => r.id === regId);
        setAcceptanceResult({
          studentName: targetReg?.studentName || data.createdStudent?.name || 'Student',
          studentId: data.studentId || data.createdStudent?.studentId || 'PAI26-XXXX',
          loginEmail: data.createdStudent?.email || '',
          temporaryPassword: data.createdStudent?.temporaryPassword || 'Pragathi2026!',
          automation: data.automation,
        });
        if (compareModalReg?.id === regId) setCompareModalReg(null);
        if (detailsModalReg?.id === regId) setDetailsModalReg(null);
      }

      await loadRegistrations(false);
    } catch (err: any) {
      alert(err.message || 'An error occurred during registration action.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (regId: string, studentName: string) => {
    if (!confirm(`Permanently delete the registration record for ${studentName}?`)) return;
    try {
      const res = await fetch(`/api/admin/registrations?id=${regId}&_t=${Date.now()}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to delete registration record.');
      setRegistrations((prev) => prev.filter((r) => r.id !== regId));
      if (detailsModalReg?.id === regId) setDetailsModalReg(null);
      if (compareModalReg?.id === regId) setCompareModalReg(null);
      loadRegistrations(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter & Search Logic
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      // Tab filter
      const normStatus = (reg.status === 'APPROVED' || reg.status === 'ACCEPTED') ? 'ACCEPTED' : reg.status;
      if (activeTab === 'PENDING' && normStatus !== 'PENDING') return false;
      if (activeTab === 'NEEDS_REVIEW' && normStatus !== 'NEEDS_REVIEW') return false;
      if (activeTab === 'ACCEPTED' && normStatus !== 'ACCEPTED') return false;
      if (activeTab === 'REJECTED' && normStatus !== 'REJECTED') return false;

      // Grade filter
      if (gradeFilter !== 'ALL' && reg.classGrade !== gradeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = reg.studentName.toLowerCase().includes(q);
        const matchesPhone = (reg.mobileNumber || '').includes(q);
        const matchesEmail = (reg.email || '').toLowerCase().includes(q);
        const matchesGuardian = (reg.parentName || '').toLowerCase().includes(q);
        const matchesRegId = (reg.registrationId || reg.id).toLowerCase().includes(q);
        const matchesStuId = (reg.studentId || '').toLowerCase().includes(q);
        const matchesSchool = (reg.schoolName || '').toLowerCase().includes(q);

        if (!matchesName && !matchesPhone && !matchesEmail && !matchesGuardian && !matchesRegId && !matchesStuId && !matchesSchool) {
          return false;
        }
      }

      return true;
    });
  }, [registrations, activeTab, gradeFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admission Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Student Registration Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atomic ID allocation, non-blocking sibling verification, and automated multi-channel credentials delivery.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/automation"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition border border-slate-300 shadow-2xs"
          >
            <Send className="w-3.5 h-3.5 text-teal-600" />
            <span>Automation Logs</span>
          </Link>

          <button
            type="button"
            onClick={() => loadRegistrations(false)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { id: 'ALL', label: 'All Registrations', count: stats.total, color: 'text-slate-900', activeBg: 'bg-slate-900 text-white' },
          { id: 'PENDING', label: 'Pending', count: stats.pending, color: 'text-amber-700', activeBg: 'bg-amber-500 text-slate-950 font-black' },
          { id: 'NEEDS_REVIEW', label: 'Needs Review', count: stats.needsReview, color: 'text-purple-700', activeBg: 'bg-purple-600 text-white' },
          { id: 'ACCEPTED', label: 'Accepted', count: stats.accepted, color: 'text-emerald-700', activeBg: 'bg-emerald-600 text-white' },
          { id: 'REJECTED', label: 'Rejected', count: stats.rejected, color: 'text-rose-700', activeBg: 'bg-rose-600 text-white' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? `${tab.activeBg} border-transparent shadow-md ring-2 ring-teal-500/50`
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>
                {tab.label}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-black ${isSelected ? 'text-inherit' : tab.color}`}>
                  {tab.count}
                </span>
                {tab.id === 'PENDING' && tab.count > 0 && !isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, phone, email, REG-2026-XXXX, or PAI26-XXXX..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="ALL">All Grades</option>
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

      {/* Registration Cards / List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className="text-xs font-bold text-slate-500">Loading registrations...</span>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-dashed border-slate-300 text-center space-y-3 max-w-xl mx-auto">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-700 mx-auto">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Registrations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || gradeFilter !== 'ALL' || activeTab !== 'ALL'
              ? 'Try modifying your search or clearing active filters.'
              : 'New student submissions from the enrollment form will appear here for review.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => {
            const normStatus = (reg.status === 'APPROVED' || reg.status === 'ACCEPTED') ? 'ACCEPTED' : reg.status;
            const hasMatches = reg.duplicateMatches && reg.duplicateMatches.length > 0;
            const isProcessing = actionLoadingId === reg.id;

            return (
              <div
                key={reg.id}
                className={`bg-white rounded-2xl border transition shadow-2xs hover:shadow-subtle overflow-hidden ${
                  normStatus === 'PENDING' && hasMatches
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : normStatus === 'PENDING'
                    ? 'border-slate-200 hover:border-teal-400'
                    : normStatus === 'ACCEPTED'
                    ? 'border-emerald-200/80 bg-emerald-50/10'
                    : normStatus === 'NEEDS_REVIEW'
                    ? 'border-purple-200 bg-purple-50/10'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                {/* Possible Match Alert Ribbon if duplicate */}
                {hasMatches && normStatus === 'PENDING' && (
                  <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        POSSIBLE MATCH DETECTED ({reg.duplicateMatches?.length} shared record{reg.duplicateMatches && reg.duplicateMatches.length > 1 ? 's' : ''}):
                      </span>
                      <span className="font-normal text-amber-800">
                        {reg.duplicateMatches?.[0]?.matchDescription || reg.duplicateMatches?.[0]?.reason || 'Shared guardian phone or email with existing student.'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCompareModalReg(reg)}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-black uppercase tracking-wider transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Compare Side-by-Side</span>
                    </button>
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Row: IDs, Name, and Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Registration ID */}
                      <div className="flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Reg:</span>
                        <span className="font-mono text-xs font-black">
                          {reg.registrationId || reg.id.substring(0, 12)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(reg.registrationId || reg.id, `reg_${reg.id}`)}
                          className="text-slate-400 hover:text-slate-700 ml-1"
                          title="Copy Registration ID"
                        >
                          {copiedId === `reg_${reg.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Student ID if accepted */}
                      {reg.studentId && (
                        <div className="flex items-center space-x-1 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-950">
                          <span className="text-[10px] font-extrabold text-emerald-700 uppercase">Student ID:</span>
                          <span className="font-mono text-xs font-black">{reg.studentId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(reg.studentId!, `stu_${reg.id}`)}
                            className="text-emerald-700 hover:text-emerald-900 ml-1"
                            title="Copy Student ID"
                          >
                            {copiedId === `stu_${reg.id}` ? (
                              <Check className="w-3 h-3 text-emerald-700" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                          normStatus === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : normStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : normStatus === 'NEEDS_REVIEW'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {normStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      Submitted: {new Date(reg.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Middle Row: Student Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Student Full Name
                      </span>
                      <strong className="text-sm text-slate-900 font-black block mt-0.5">
                        {reg.studentName}
                      </strong>
                      <span className="text-[11px] text-slate-600 font-semibold">
                        Grade {reg.classGrade} {reg.section ? `• Section ${reg.section}` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        School Name
                      </span>
                      <strong className="text-xs text-slate-800 font-bold block mt-0.5 truncate" title={reg.schoolName}>
                        {reg.schoolName || 'Not specified'}
                      </strong>
                      <span className="text-[11px] text-slate-500">{reg.location || 'Location N/A'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Parent / Guardian
                      </span>
                      <strong className="text-xs text-slate-800 font-bold block mt-0.5">
                        {reg.parentName || 'Guardian'}
                      </strong>
                      <div className="flex items-center space-x-1 text-teal-800 font-mono font-bold mt-0.5">
                        <Phone className="w-3 h-3 text-teal-600" />
                        <span>{reg.mobileNumber}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Contact / Login Email
                      </span>
                      <span className="text-xs text-slate-700 truncate block mt-0.5 font-medium" title={reg.assignedEmail || reg.email}>
                        {reg.assignedEmail || reg.email || 'None provided'}
                      </span>
                      {reg.assignedEmail && (
                        <span className="text-[10px] text-emerald-700 font-bold">✓ Portal Account Ready</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Action 1: Accept */}
                      {(normStatus === 'PENDING' || normStatus === 'NEEDS_REVIEW') && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => executeAction(reg.id, 'ACCEPT')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Provisioning...' : 'Accept & Provision'}</span>
                        </button>
                      )}

                      {/* Action 2: Accept as Sibling / Family Member */}
                      {hasMatches && (normStatus === 'PENDING' || normStatus === 'NEEDS_REVIEW') && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => executeAction(reg.id, 'ACCEPT_AS_SIBLING')}
                          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Accept as Sibling / Family</span>
                        </button>
                      )}

                      {/* Action 3: Mark Needs Review */}
                      {normStatus === 'PENDING' && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => executeAction(reg.id, 'NEEDS_REVIEW')}
                          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          <Clock className="w-3.5 h-3.5 inline mr-1" />
                          <span>Needs Review</span>
                        </button>
                      )}

                      {/* Action 4: Reject */}
                      {(normStatus === 'PENDING' || normStatus === 'NEEDS_REVIEW') && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            const reason = prompt('Optional rejection note (will be sent to applicant):');
                            if (reason !== null) {
                              executeAction(reg.id, 'REJECT', reason);
                            }
                          }}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5 inline mr-1" />
                          <span>Reject</span>
                        </button>
                      )}

                      {/* If Accepted, View Credentials */}
                      {normStatus === 'ACCEPTED' && (
                        <button
                          type="button"
                          onClick={() =>
                            setAcceptanceResult({
                              studentName: reg.studentName,
                              studentId: reg.studentId || 'PAI26-XXXX',
                              loginEmail: reg.assignedEmail || reg.email || '',
                              temporaryPassword: reg.temporaryPassword || 'Pragathi2026!',
                            })
                          }
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Assigned Credentials</span>
                        </button>
                      )}

                      {/* Revert to Pending if Rejected or Needs Review */}
                      {(normStatus === 'REJECTED' || normStatus === 'NEEDS_REVIEW') && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => executeAction(reg.id, 'MARK_PENDING')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                          Revert to Pending
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setDetailsModalReg(reg)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                      >
                        View Full Details
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(reg.id, reg.studentName)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete registration record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SIDE-BY-SIDE DUPLICATE COMPARISON MODAL */}
      {/* ======================================================== */}
      {compareModalReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-amber-950 p-6 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Non-Blocking Identity & Sibling Verification</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Compare Registration Records
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalReg(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Content Body: Side by Side Grid */}
            <div className="p-6 space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 leading-relaxed space-y-1">
                <p className="font-bold flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Duplicate Contact Policy:</span>
                </p>
                <p>
                  Multiple children from the same family legitimately share parent contact details. Check whether this application is a <strong>duplicate re-submission for the same student</strong> or a <strong>new sibling from the same household</strong>.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Column 1: Incoming Application */}
                <div className="bg-teal-50/50 rounded-2xl p-5 border-2 border-teal-500 space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-200 pb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-teal-200 text-teal-900 rounded-full">
                      Incoming New Registration
                    </span>
                    <span className="font-mono text-xs font-black text-teal-900">
                      {compareModalReg.registrationId}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Student Name</span>
                      <span className="text-base font-black text-slate-900">{compareModalReg.studentName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Class / Grade</span>
                        <strong className="text-slate-800">Grade {compareModalReg.classGrade}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Section</span>
                        <strong className="text-slate-800">{compareModalReg.section || 'None specified'}</strong>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">School Name</span>
                      <span className="text-slate-800 font-semibold">{compareModalReg.schoolName}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Parent / Guardian</span>
                      <span className="text-slate-800 font-bold">{compareModalReg.parentName}</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-teal-200">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Guardian Phone Number</span>
                      <strong className="text-teal-900 font-mono text-sm">{compareModalReg.mobileNumber}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Email</span>
                      <span className="text-slate-800">{compareModalReg.email || 'None'}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Location</span>
                      <span className="text-slate-800">{compareModalReg.location}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Existing Matched Student / Application */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-300 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded-full">
                      Existing Matching Record
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-600">
                      {compareModalReg.duplicateMatches?.[0]?.matchedRecordId || 'N/A'}
                    </span>
                  </div>

                  {compareModalReg.duplicateMatches?.[0] ? (
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Existing Student Name</span>
                        <span className="text-base font-black text-slate-900">
                          {compareModalReg.duplicateMatches[0].studentName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Class / Grade</span>
                          <strong className="text-slate-800">
                            Grade {compareModalReg.duplicateMatches[0].classGrade || 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Record Type</span>
                          <strong className="text-slate-800">{compareModalReg.duplicateMatches[0].type}</strong>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Shared Guardian Phone</span>
                        <strong className="text-slate-900 font-mono text-sm">
                          {compareModalReg.duplicateMatches[0].guardianPhone || 'N/A'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Registered Email</span>
                        <span className="text-slate-800">{compareModalReg.duplicateMatches[0].guardianEmail || 'N/A'}</span>
                      </div>

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                        <span className="text-[10px] font-bold uppercase block text-amber-800">Match Reason</span>
                        <span className="font-semibold text-xs leading-relaxed">
                          {compareModalReg.duplicateMatches[0].matchDescription || compareModalReg.duplicateMatches[0].reason}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No detailed match data found.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCompareModalReg(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => executeAction(compareModalReg.id, 'ACCEPT_AS_SIBLING')}
                    className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Accept as Sibling / Family Member</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeAction(compareModalReg.id, 'ACCEPT')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Regular</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeAction(compareModalReg.id, 'NEEDS_REVIEW')}
                    className="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs rounded-xl transition"
                  >
                    Mark Needs Review
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const reason = prompt('Rejection reason for this record:');
                      if (reason !== null) executeAction(compareModalReg.id, 'REJECT', reason);
                    }}
                    className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl transition"
                  >
                    Reject Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ACCEPTANCE SUCCESS & AUTOMATION REPORT MODAL */}
      {/* ======================================================== */}
      {acceptanceResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Registration Accepted
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                Student Account Activated!
              </h3>
              <p className="text-xs text-slate-600">
                Official atomic Student ID assigned to <strong>{acceptanceResult.studentName}</strong>.
              </p>
            </div>

            {/* Generated Credentials Card */}
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Official Permanent Student ID
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xl font-black font-mono text-emerald-950">
                    {acceptanceResult.studentId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(acceptanceResult.studentId, 'res_id')}
                    className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg transition"
                  >
                    {copiedId === 'res_id' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Portal Login Email
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs font-mono font-bold text-slate-800 truncate">
                    {acceptanceResult.loginEmail}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(acceptanceResult.loginEmail, 'res_email')}
                    className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg transition"
                  >
                    {copiedId === 'res_email' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Initial Password
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {acceptanceResult.temporaryPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(acceptanceResult.temporaryPassword, 'res_pw')}
                    className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg transition"
                  >
                    {copiedId === 'res_pw' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Automation Dispatch Summary */}
            {acceptanceResult.automation && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">
                  Automated Multi-Channel Dispatch Report
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(acceptanceResult.automation).map(([ch, info]: [string, any]) => (
                    <div key={ch} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700">{ch}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                          info.status === 'DELIVERED' || info.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : info.status === 'NOT_CONFIGURED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {info.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setAcceptanceResult(null)}
              className="w-full py-3 bg-brand-navy hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: VIEW FULL DETAILS MODAL */}
      {/* ======================================================== */}
      {detailsModalReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Application Details: {detailsModalReg.studentName}
              </h3>
              <button
                type="button"
                onClick={() => setDetailsModalReg(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Registration ID</span>
                  <span className="font-mono font-bold text-slate-900">{detailsModalReg.registrationId || detailsModalReg.id}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Student ID</span>
                  <span className="font-mono font-bold text-slate-900">{detailsModalReg.studentId || 'Pending Acceptance'}</span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl">
                <p><strong>School:</strong> {detailsModalReg.schoolName}</p>
                <p><strong>Grade & Section:</strong> Grade {detailsModalReg.classGrade} {detailsModalReg.section ? `(Sec ${detailsModalReg.section})` : ''}</p>
                <p><strong>Guardian:</strong> {detailsModalReg.parentName}</p>
                <p><strong>Mobile Phone:</strong> {detailsModalReg.mobileNumber}</p>
                <p><strong>Email:</strong> {detailsModalReg.email || 'None'}</p>
                <p><strong>Location:</strong> {detailsModalReg.location}</p>
                <p><strong>Submitted:</strong> {new Date(detailsModalReg.createdAt).toLocaleString()}</p>
                {detailsModalReg.approvedAt && (
                  <p><strong>Approved:</strong> {new Date(detailsModalReg.approvedAt).toLocaleString()}</p>
                )}
                {detailsModalReg.notes && (
                  <p className="text-amber-800"><strong>Notes:</strong> {detailsModalReg.notes}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDetailsModalReg(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
