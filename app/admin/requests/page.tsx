'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Key,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  User,
  Phone,
  Mail,
  Shield,
  GraduationCap,
  AlertCircle,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { AdminHelpRequest } from '@/lib/db/types';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminHelpRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reply modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<AdminHelpRequest | null>(null);
  const [replyText, setReplyText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Success alert
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    fetch(`/api/support/request?_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load requests');
        return res.json();
      })
      .then((data) => {
        setRequests(data.requests || []);
        if (data.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleResolveAction = async (
    reqId: string,
    action: 'RESOLVE_WITH_CREDENTIALS' | 'RESOLVE_WITH_RESET' | 'RESOLVE_WITH_MESSAGE',
    extra?: { replyMessage?: string; adminNotes?: string }
  ) => {
    setActionLoadingId(reqId);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/support/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqId,
          action,
          replyMessage: extra?.replyMessage,
          adminNotes: extra?.adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to perform action');

      setActionSuccess(
        `Action completed: Notification dispatched via ${
          data.delivery?.whatsapp?.dispatched ? 'WhatsApp' : ''
        } ${data.delivery?.email?.dispatched ? 'and Email' : ''}`.trim()
      );

      // Refresh list
      fetchRequests();
      if (replyModalOpen) {
        setReplyModalOpen(false);
        setActiveRequest(null);
        setReplyText('');
        setAdminNotes('');
      }
    } catch (err: any) {
      alert(err.message || 'Error processing request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'PENDING' && r.status !== 'PENDING') return false;
    if (activeTab === 'RESOLVED' && r.status !== 'RESOLVED') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.requesterName.toLowerCase().includes(q) ||
      (r.requesterPhone && r.requesterPhone.includes(q)) ||
      (r.requesterEmail && r.requesterEmail.toLowerCase().includes(q)) ||
      (r.studentId && r.studentId.toLowerCase().includes(q)) ||
      r.subject.toLowerCase().includes(q) ||
      r.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Help & Credential Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Requests from students and instructors for User IDs, password resets, or assistance. Dispatch 1-click credentials anytime via WhatsApp & Email.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs w-fit cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Success banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Action</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting admin resolution</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{stats.resolved}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Dispatched & fulfilled</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Requests</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">All received requests</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Pending</span>
            {stats.pending > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'PENDING' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {stats.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'RESOLVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Resolved ({stats.resolved})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>All ({stats.total})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, phone, email, student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'PENDING';
            const isWorking = actionLoadingId === req.id;

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl p-5 border transition shadow-subtle ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-200/80 bg-gradient-to-r from-amber-50/20 via-white to-white'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Requester Info */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center text-sm">
                        {req.requesterName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                          <span>{req.requesterName}</span>
                          {req.studentId && (
                            <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-200">
                              {req.studentId}
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* Requester Role */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-700">
                        {req.requesterRole}
                      </span>

                      {/* Request Type */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          req.type === 'PASSWORD_RESET'
                            ? 'bg-amber-100 text-amber-800'
                            : req.type === 'CREDENTIALS_REQUEST' || req.type === 'USER_ID_REQUEST'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {req.type.replace(/_/g, ' ')}
                      </span>

                      {/* Status */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isPending ? 'bg-amber-100 text-amber-900 font-black' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Contact coordinates */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      {req.requesterPhone && (
                        <div className="flex items-center space-x-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>+91 {req.requesterPhone.replace(/\D/g, '').slice(-10)}</span>
                        </div>
                      )}
                      {req.requesterEmail && (
                        <div className="flex items-center space-x-1 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.requesterEmail}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Submitted {new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Subject & Message */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                      <p className="font-bold text-slate-800">{req.subject}</p>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{req.message}</p>
                    </div>

                    {/* Admin notes if resolved */}
                    {req.adminNotes && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 font-medium">
                        <strong>Admin Note:</strong> {req.adminNotes}
                        {req.resolvedAt && (
                          <span className="text-emerald-600 ml-2">({new Date(req.resolvedAt).toLocaleString()})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col gap-2 min-w-[220px] shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      1-Click Actions
                    </span>

                    {/* 1. Send Login ID & Password */}
                    <button
                      onClick={() => handleResolveAction(req.id, 'RESOLVE_WITH_CREDENTIALS')}
                      disabled={isWorking}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      title="Sends official login email/ID and active password to student's WhatsApp and Email"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isWorking ? 'Processing...' : 'Send ID & Password'}</span>
                    </button>

                    {/* 2. Reset Password & Dispatch */}
                    <button
                      onClick={() => {
                        if (confirm(`Reset password to temporary "Pragathi2026!" and send via WhatsApp & Email to ${req.requesterName}?`)) {
                          handleResolveAction(req.id, 'RESOLVE_WITH_RESET');
                        }
                      }}
                      disabled={isWorking}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      title="Resets password to Pragathi2026! and dispatches new credentials immediately"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Reset & Send Password</span>
                    </button>

                    {/* 3. Send Custom Reply */}
                    <button
                      onClick={() => {
                        setActiveRequest(req);
                        setReplyModalOpen(true);
                      }}
                      disabled={isWorking}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Custom Reply / Message</span>
                    </button>

                    {/* WhatsApp Quick Direct Link */}
                    {req.requesterPhone && (
                      <a
                        href={`https://wa.me/91${req.requesterPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                          `*PRAGATHI AI EDUCATION - SUPPORT*\n\nHello ${req.requesterName},\nWe received your request regarding: "${req.subject}".\n\nOur administrative team is here to assist you. Please let us know if you need any further information!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1"
                      >
                        <span>Open WhatsApp Chat</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Requests Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No requests matched your query. Try a different name or phone number.'
              : 'There are currently no requests in this category. All submitted queries are up to date!'}
          </p>
        </div>
      )}

      {/* Reply / Custom Message Modal */}
      {replyModalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Admin Resolution Reply
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Reply to {activeRequest.requesterName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setReplyModalOpen(false);
                  setActiveRequest(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
                <span className="font-bold text-slate-800">Regarding: </span>
                {activeRequest.subject}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reply Message (Dispatched via WhatsApp & Email) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Enter your administrative response or instructions..."
                  className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Admin Notes (Optional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified by phone call, password updated"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyModalOpen(false);
                    setActiveRequest(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!replyText.trim() || actionLoadingId === activeRequest.id}
                  onClick={() =>
                    handleResolveAction(activeRequest.id, 'RESOLVE_WITH_MESSAGE', {
                      replyMessage: replyText,
                      adminNotes,
                    })
                  }
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply & Resolve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
