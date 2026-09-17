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

  useEffect(() => {
    loadData();
  }, []);

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
