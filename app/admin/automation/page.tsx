'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Phone,
  Mail,
  Bell,
  Radio,
  ArrowLeft,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';
import { AutomationLog, AutomationChannel, AutomationStatus } from '@/lib/db/types';

export default function AdminAutomationPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [providers, setProviders] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Direct Dispatcher State (Individual & Broadcast)
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [dispatchTargetRole, setDispatchTargetRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [dispatchScope, setDispatchScope] = useState<'INDIVIDUAL' | 'BROADCAST'>('INDIVIDUAL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [dispatchChannelWa, setDispatchChannelWa] = useState(true);
  const [dispatchChannelEmail, setDispatchChannelEmail] = useState(true);
  const [dispatchAction, setDispatchAction] = useState<'CUSTOM_MESSAGE' | 'SEND_CREDENTIALS'>('CUSTOM_MESSAGE');
  const [dispatchSubject, setDispatchSubject] = useState('Important Announcement from PRAGATHI AI');
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatchSending, setDispatchSending] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchDelivery, setDispatchDelivery] = useState<any>(null);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/automation?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setProviders(data.providers);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load automation data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const [stuRes, instRes] = await Promise.all([
        fetch(`/api/admin/users?role=STUDENT&_t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/users?role=INSTRUCTOR&_t=${Date.now()}`, { cache: 'no-store' }),
      ]);
      const stuData = await stuRes.json();
      const instData = await instRes.json();
      if (stuRes.ok) setStudents(stuData.users || []);
      if (instRes.ok) setInstructors(instData.users || []);
    } catch (err) {
      console.error('Failed to load recipients:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadRecipients();
  }, []);

  const handleDirectDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const channels: ('WHATSAPP' | 'EMAIL')[] = [];
    if (dispatchChannelWa) channels.push('WHATSAPP');
    if (dispatchChannelEmail) channels.push('EMAIL');
    if (channels.length === 0) {
      setDispatchError('Please select at least one delivery channel (WhatsApp or Email).');
      return;
    }

    if (dispatchScope === 'INDIVIDUAL') {
      if (!selectedStudentId && !manualPhone && !manualEmail) {
        setDispatchError(
          `Please select a ${dispatchTargetRole === 'INSTRUCTOR' ? 'faculty instructor' : 'student'} or enter a recipient phone/email.`
        );
        return;
      }
    }

    if (dispatchAction === 'CUSTOM_MESSAGE' && !dispatchMessage.trim()) {
      setDispatchError('Please enter a message to send.');
      return;
    }

    setDispatchSending(true);
    setDispatchSuccess(null);
    setDispatchError(null);

    try {
      const payload: any = {
        recipientScope: dispatchScope,
        targetRole: dispatchTargetRole,
        actionType: dispatchAction,
        channels,
        customSubject: dispatchSubject,
        customMessage: dispatchMessage,
        newPassword:
          dispatchAction === 'SEND_CREDENTIALS'
            ? dispatchTargetRole === 'INSTRUCTOR'
              ? 'Faculty2026!'
              : 'Pragathi2026!'
            : undefined,
      };

      if (dispatchScope === 'INDIVIDUAL') {
        if (selectedStudentId) {
          payload.userId = selectedStudentId;
          payload.studentUserId = selectedStudentId;
          payload.role = dispatchTargetRole;
        } else {
          payload.recipientName =
            manualName || (dispatchTargetRole === 'INSTRUCTOR' ? 'Faculty Member' : 'Student');
          payload.recipientPhone = manualPhone;
          payload.recipientEmail = manualEmail;
          payload.role = dispatchTargetRole;
        }
      }

      const res = await fetch('/api/admin/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispatch failed');

      setDispatchSuccess(data.message || 'Notification dispatched successfully!');
      setDispatchDelivery(data.delivery || data.delivered || null);
      if (dispatchAction === 'CUSTOM_MESSAGE') {
        setDispatchMessage('');
      }
      loadData(false);
    } catch (err: any) {
      setDispatchError(err.message || 'Error dispatching notification');
    } finally {
      setDispatchSending(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingLogId(logId);
    try {
      const res = await fetch('/api/admin/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry failed');
      alert(`Retry dispatched: Status is now ${data.result?.status}`);
      loadData(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRetryingLogId(null);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (channelFilter !== 'ALL' && log.channel !== channelFilter) return false;
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (log.recipientName || '').toLowerCase().includes(q);
        const matchesRecipient = (log.recipient || '').toLowerCase().includes(q);
        const matchesStudentId = (log.studentId || '').toLowerCase().includes(q);
        const matchesRegId = (log.registrationId || '').toLowerCase().includes(q);
        const matchesEvent = (log.event || '').toLowerCase().includes(q);

        if (!matchesName && !matchesRecipient && !matchesStudentId && !matchesRegId && !matchesEvent) {
          return false;
        }
      }

      return true;
    });
  }, [logs, channelFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              href="/admin/registrations"
              className="p-1 text-slate-400 hover:text-slate-800 rounded-lg transition"
              title="Back to Registrations"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Multi-Channel Automation Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 pl-7">
            Real-time delivery telemetry for server WhatsApp, Transactional Email, In-App Notifications, and Web Push.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(false)}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 shadow-2xs self-start cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Provider Health Cards */}
      {providers && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* WhatsApp */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                  providers.whatsapp.configured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {providers.whatsapp.configured ? 'Active' : 'Standby'}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Channel</span>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">WhatsApp API</h3>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{providers.whatsapp.provider}</p>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                  providers.email.configured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {providers.email.configured ? 'Active' : 'Standby'}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Channel</span>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">Transactional Email</h3>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{providers.email.provider}</p>
            </div>
          </div>

          {/* In-App Notifications */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Channel</span>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">In-App Notification</h3>
              <p className="text-[11px] text-slate-500 mt-1 truncate">Pragathi Engine</p>
            </div>
          </div>

          {/* Web Push */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                  providers.push.configured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {providers.push.configured ? 'Active' : 'Standby'}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Channel</span>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">Browser Web Push</h3>
              <p className="text-[11px] text-slate-500 mt-1 truncate">VAPID Push Service</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Counters */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Attempts</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-[11px] font-bold uppercase text-emerald-600">Delivered</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats.delivered}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-[11px] font-bold uppercase text-teal-600">Dispatched / Sent</span>
            <p className="text-2xl font-black text-teal-700 mt-1">{stats.sent}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-[11px] font-bold uppercase text-rose-600">Failed / Retrying</span>
            <p className="text-2xl font-black text-rose-700 mt-1">{stats.failed}</p>
          </div>
        </div>
      )}

      {/* Direct Notification Dispatch Console (Individual & Broadcast) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
              Multi-Channel Dispatch Hub
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center space-x-2">
              <Send className="w-4 h-4 text-teal-600" />
              <span>Direct Notification Dispatcher</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Send notifications individually to a specific recipient or broadcast to all enrolled students via WhatsApp and Email.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Target Audience Toggle: Students vs Instructors */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDispatchTargetRole('STUDENT');
                  setSelectedStudentId('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dispatchTargetRole === 'STUDENT'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 Students ({students.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setDispatchTargetRole('INSTRUCTOR');
                  setSelectedStudentId('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dispatchTargetRole === 'INSTRUCTOR'
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👨‍🏫 Faculty ({instructors.length})
              </button>
            </div>

            {/* Scope Toggle: Individual vs Broadcast */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
              <button
                type="button"
                onClick={() => setDispatchScope('INDIVIDUAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dispatchScope === 'INDIVIDUAL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👤 Individual {dispatchTargetRole === 'INSTRUCTOR' ? 'Faculty' : 'Student'}
              </button>
              <button
                type="button"
                onClick={() => setDispatchScope('BROADCAST')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dispatchScope === 'BROADCAST'
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📢 Broadcast All ({dispatchTargetRole === 'INSTRUCTOR' ? instructors.length : students.length})
              </button>
            </div>
          </div>
        </div>

        {dispatchSuccess && (
          <div className={`p-4 rounded-xl text-xs space-y-2 ${
            (dispatchDelivery?.whatsapp?.dispatched === false || (typeof dispatchDelivery?.whatsapp === 'number' && dispatchDelivery?.whatsapp === 0)) && dispatchChannelWa
              ? 'bg-amber-50 border border-amber-200 text-amber-900'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-start space-x-2.5">
              {(dispatchDelivery?.whatsapp?.dispatched === false || (typeof dispatchDelivery?.whatsapp === 'number' && dispatchDelivery?.whatsapp === 0)) && dispatchChannelWa ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">{dispatchSuccess}</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Delivery logs updated below in real-time.
                </p>
                {dispatchDelivery?.whatsapp?.error && (
                  <div className="mt-2 p-2.5 bg-amber-100/80 border border-amber-300 rounded-lg text-[11px] text-amber-950">
                    <strong>WhatsApp Gateway Status:</strong> {dispatchDelivery.whatsapp.error}
                    {dispatchDelivery.whatsapp.error.includes('allowed') && (
                      <p className="mt-1 text-[10px] text-amber-800">
                        💡 <strong>Meta Sandbox Restriction:</strong> In Meta developer test mode, recipient numbers must be added to your <em>Allowed Recipient Phone Numbers</em> list in Meta Developer Console before Meta will permit delivery.
                      </p>
                    )}
                  </div>
                )}
                {typeof dispatchDelivery?.whatsapp === 'number' && dispatchDelivery?.whatsapp === 0 && dispatchChannelWa && (
                  <div className="mt-2 p-2.5 bg-amber-100/80 border border-amber-300 rounded-lg text-[11px] text-amber-950">
                    💡 <strong>Meta Sandbox Restriction:</strong> WhatsApp delivered to 0 recipients because student phone numbers are not in your Meta Developer Console allowed recipient list.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {dispatchError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{dispatchError}</span>
          </div>
        )}

        <form onSubmit={handleDirectDispatch} className="space-y-4">
          {/* Target Selection */}
          {dispatchScope === 'INDIVIDUAL' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select {dispatchTargetRole === 'INSTRUCTOR' ? 'Faculty Instructor' : 'Enrolled Student'}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    if (e.target.value) {
                      setManualPhone('');
                      setManualEmail('');
                      setManualName('');
                    }
                  }}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                >
                  {dispatchTargetRole === 'INSTRUCTOR' ? (
                    <>
                      <option value="">-- Choose from Faculty Instructors ({instructors.length}) --</option>
                      {instructors.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.instructorDetails?.designation || 'Faculty'}) — {inst.email} • {inst.phone || 'No phone'}
                        </option>
                      ))}
                    </>
                  ) : (
                    <>
                      <option value="">-- Choose from Enrolled Students ({students.length}) --</option>
                      {students.map((stu) => (
                        <option key={stu.id} value={stu.id}>
                          {stu.name} ({stu.studentDetails?.studentId || 'ID Pending'}) — {stu.email}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Or enter manual recipient details below if not in directory.
                </span>
              </div>

              {!selectedStudentId && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder={dispatchTargetRole === 'INSTRUCTOR' ? 'Faculty Name' : 'Student Name'}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="9618611522"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-teal-950 flex items-center space-x-1.5">
                  <span>
                    📢 Broadcast Audience: All {dispatchTargetRole === 'INSTRUCTOR' ? 'Faculty Instructors' : 'Enrolled Students'}
                  </span>
                  <span className="px-2 py-0.5 bg-teal-200 text-teal-900 rounded-full text-[10px] font-black">
                    {dispatchTargetRole === 'INSTRUCTOR' ? instructors.length : students.length} Recipients
                  </span>
                </p>
                <p className="text-teal-700 text-[11px] mt-0.5">
                  Notification will dispatch simultaneously to all {dispatchTargetRole === 'INSTRUCTOR' ? 'faculty instructors' : 'enrolled students'} registered in the platform via WhatsApp & Email.
                </p>
              </div>
            </div>
          )}

          {/* Delivery Channels */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Delivery Channel(s) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                  dispatchChannelWa
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={dispatchChannelWa}
                  onChange={(e) => setDispatchChannelWa(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                />
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block font-bold">WhatsApp Automation</span>
                  <span className="text-[10px] text-slate-500 block">
                    Official Meta Cloud API (ID: 1372882829235916)
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                  dispatchChannelEmail
                    ? 'bg-teal-50 border-teal-300 text-teal-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={dispatchChannelEmail}
                  onChange={(e) => setDispatchChannelEmail(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500"
                />
                <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="block font-bold">Gmail API Email Automation</span>
                  <span className="text-[10px] text-slate-500 block">
                    Official Sender: hello.pragathiai@gmail.com
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notice Templates
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDispatchAction('CUSTOM_MESSAGE');
                  setDispatchSubject('Module Exam & Quiz Schedule Announcement');
                  setDispatchMessage('Dear Students,\n\nPlease note that your upcoming Module Quiz is scheduled this week. Log in to your Pragathi AI portal to review your study materials and complete the quiz on time.');
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
              >
                📝 Quiz / Exam Notice
              </button>
              <button
                type="button"
                onClick={() => {
                  setDispatchAction('CUSTOM_MESSAGE');
                  setDispatchSubject('Important Class Schedule Update');
                  setDispatchMessage('Dear Students,\n\nPlease review the updated live class timing on your student dashboard under the Curriculum section. Ensure you join on time.');
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
              >
                ⏰ Class Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setDispatchAction('CUSTOM_MESSAGE');
                  setDispatchSubject('Holiday & Session Rescheduling Notice');
                  setDispatchMessage('Dear Students,\n\nPlease note that classes will remain suspended on the upcoming holiday. Regular sessions resume as scheduled the following day.');
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
              >
                🏖️ Holiday Notice
              </button>
              {dispatchScope === 'INDIVIDUAL' && selectedStudentId && (
                <button
                  type="button"
                  onClick={() => {
                    setDispatchAction('SEND_CREDENTIALS');
                    setDispatchSubject('Your Pragathi AI Student Login Credentials');
                  }}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[11px] font-bold border border-teal-200 transition cursor-pointer"
                >
                  🔑 Student Login Credentials
                </button>
              )}
            </div>
          </div>

          {/* Subject & Body */}
          {dispatchAction === 'CUSTOM_MESSAGE' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  value={dispatchSubject}
                  onChange={(e) => setDispatchSubject(e.target.value)}
                  placeholder="e.g. Important Announcement from PRAGATHI AI"
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Body / Message *
                </label>
                <textarea
                  rows={3}
                  required
                  value={dispatchMessage}
                  onChange={(e) => setDispatchMessage(e.target.value)}
                  placeholder="Write the message content to dispatch..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={dispatchSending || (!dispatchChannelWa && !dispatchChannelEmail)}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>
                {dispatchSending
                  ? 'Dispatching in Progress...'
                  : dispatchScope === 'BROADCAST'
                  ? `Broadcast to All (${students.length}) via ${
                      dispatchChannelWa && dispatchChannelEmail
                        ? 'WhatsApp & Email'
                        : dispatchChannelWa
                        ? 'WhatsApp Only'
                        : 'Email Only'
                    }`
                  : `Dispatch to Individual via ${
                      dispatchChannelWa && dispatchChannelEmail
                        ? 'WhatsApp & Email'
                        : dispatchChannelWa
                        ? 'WhatsApp Only'
                        : 'Email Only'
                    }`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by recipient name, phone, email, or Student ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
            <option value="IN_APP">In-App</option>
            <option value="PUSH">Browser Push</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="NOT_CONFIGURED">Not Configured</option>
          </select>
        </div>
      </div>

      {/* Delivery Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Delivery Audit Log ({filteredLogs.length})
          </h2>
          <span className="text-xs text-slate-400">Sorted by most recent</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No automation log records found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isRetrying = retryingLogId === log.id;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="inline-flex items-center space-x-1.5">
                          {log.channel === 'WHATSAPP' && <Phone className="w-3.5 h-3.5 text-emerald-600" />}
                          {log.channel === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-teal-600" />}
                          {log.channel === 'IN_APP' && <Bell className="w-3.5 h-3.5 text-purple-600" />}
                          {log.channel === 'PUSH' && <Radio className="w-3.5 h-3.5 text-indigo-600" />}
                          <span>{log.channel}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                        {log.event}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{log.recipientName || 'Applicant'}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{log.recipient}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {log.studentId || log.registrationId || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            log.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : log.status === 'SENT'
                              ? 'bg-teal-100 text-teal-900'
                              : log.status === 'NOT_CONFIGURED'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {log.status}
                        </span>
                        {log.errorReason && (
                          <span className="block text-[10px] text-rose-600 mt-0.5 max-w-xs truncate" title={log.errorReason}>
                            {log.errorReason}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {log.status === 'FAILED' ? (
                          <button
                            type="button"
                            disabled={isRetrying}
                            onClick={() => handleRetry(log.id)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[10px] transition disabled:opacity-50"
                          >
                            {isRetrying ? 'Retrying...' : 'Retry Channel'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Logged</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
