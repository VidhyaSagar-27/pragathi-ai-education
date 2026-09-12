'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  School,
  Phone,
  Mail,
  ArrowRight,
  UserCheck,
  Check,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function AdminFamilyReviewPage() {
  const [data, setData] = useState<{
    families: any[];
    possibleDuplicates: any[];
    confirmedDuplicates: any[];
    duplicateLogs: any[];
    stats: any;
  }>({
    families: [],
    possibleDuplicates: [],
    confirmedDuplicates: [],
    duplicateLogs: [],
    stats: {
      totalFamilies: 0,
      totalPossibleDuplicates: 0,
      totalConfirmedDuplicates: 0,
      totalAuditLogs: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'duplicates' | 'families' | 'logs'>('duplicates');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetch(`/api/admin/family-review?_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        setData({
          families: res.families || [],
          possibleDuplicates: res.possibleDuplicates || [],
          confirmedDuplicates: res.confirmedDuplicates || [],
          duplicateLogs: res.duplicateLogs || [],
          stats: res.stats || {},
        });
        if ((res.possibleDuplicates || []).length === 0 && (res.families || []).length > 0) {
          setActiveTab('families');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleAction = async (action: 'CONFIRM_DUPLICATE' | 'KEEP_SEPARATE', registrationId: string) => {
    setActionProcessingId(registrationId);
    try {
      const res = await fetch('/api/admin/family-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, registrationId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to perform review action');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error processing action');
    } finally {
      setActionProcessingId(null);
    }
  };

  const filteredFamilies = data.families.filter((fam) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (fam.id.toLowerCase().includes(q)) return true;
    if (fam.familyName?.toLowerCase().includes(q)) return true;
    if (fam.parentName?.toLowerCase().includes(q)) return true;
    if (fam.parentPhones?.some((p: string) => p.includes(q))) return true;
    if (fam.parentEmails?.some((e: string) => e.toLowerCase().includes(q))) return true;
    if (fam.enrolledChildren?.some((c: any) => c.name.toLowerCase().includes(q))) return true;
    if (fam.registrationChildren?.some((c: any) => c.name.toLowerCase().includes(q))) return true;
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4 text-teal-600" />
          <span>Identity & Family Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Duplicate & Family Review Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Review possible student duplicates, resolve uncertain applications, and manage multi-child family accounts. Genuine siblings sharing parent contact details are preserved as separate accounts.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Possible Duplicates</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{data.stats.totalPossibleDuplicates || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Requiring Admin Verification</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Tracked Families</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{data.stats.totalFamilies || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Multi-Child Family Accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Confirmed Duplicates</span>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{data.stats.totalConfirmedDuplicates || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Closed Duplicate Submissions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Audit Attempts</span>
            <FileText className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{data.stats.totalAuditLogs || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Logged Duplicate Submissions</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 sm:space-x-8">
        <button
          type="button"
          onClick={() => setActiveTab('duplicates')}
          className={`pb-3 text-sm font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'duplicates'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Possible Duplicates</span>
          <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
            {data.possibleDuplicates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('families')}
          className={`pb-3 text-sm font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'families'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-teal-600" />
          <span>Family Accounts & Children</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {data.families.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Duplicate Audit Logs</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {data.duplicateLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: POSSIBLE DUPLICATES */}
      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          {data.possibleDuplicates.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Duplicates Requiring Review</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                All incoming student applications have either been verified as distinct children or automatically classified.
              </p>
            </div>
          ) : (
            data.possibleDuplicates.map(({ candidate, matchedRecord, confidence, matchSignals }: any) => (
              <div
                key={candidate.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300 shadow-md space-y-6"
              >
                {/* Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        Match Confidence: {confidence}%
                      </span>
                      <h3 className="text-lg font-black text-slate-900">
                        Possible Duplicate Application Detected
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {matchSignals.map((signal: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-semibold"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Candidate Application */}
                  <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        New Incoming Application
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                        PENDING VERIFICATION
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900">{candidate.studentName}</h4>

                    <div className="space-y-1.5 text-xs text-slate-700">
                      <p>
                        <strong className="text-slate-900">Class & School:</strong> Grade {candidate.classGrade} • {candidate.schoolName}
                      </p>
                      <p>
                        <strong className="text-slate-900">Parent / Guardian:</strong> {candidate.parentName}
                      </p>
                      <p>
                        <strong className="text-slate-900">Phone:</strong> {candidate.mobileNumber}
                      </p>
                      {candidate.email && (
                        <p>
                          <strong className="text-slate-900">Email:</strong> {candidate.email}
                        </p>
                      )}
                      <p className="text-slate-500 pt-1">
                        Submitted on: {new Date(candidate.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Existing Record */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Existing Record Match
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          matchedRecord?.status === 'APPROVED' || matchedRecord?.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {matchedRecord ? matchedRecord.type : 'RECORD NOT FOUND'}
                      </span>
                    </div>

                    {matchedRecord ? (
                      <>
                        <h4 className="text-xl font-bold text-slate-900">{matchedRecord.name}</h4>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <p>
                            <strong className="text-slate-900">Class & School:</strong> Grade {matchedRecord.classGrade} • {matchedRecord.schoolName}
                          </p>
                          <p>
                            <strong className="text-slate-900">Parent / Guardian:</strong> {matchedRecord.parentName}
                          </p>
                          <p>
                            <strong className="text-slate-900">Phone:</strong> {matchedRecord.parentPhone}
                          </p>
                          {matchedRecord.parentEmail && (
                            <p>
                              <strong className="text-slate-900">Email:</strong> {matchedRecord.parentEmail}
                            </p>
                          )}
                          <p className="text-slate-500 pt-1">
                            Status: <span className="font-semibold text-teal-700">{matchedRecord.status}</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-4">
                        Matched record details no longer available.
                      </p>
                    )}
                  </div>
                </div>

                {/* Admin Decision Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 mr-auto">
                    Admin decision required: Is this the same student submitting again, or a genuine sibling?
                  </span>

                  <button
                    type="button"
                    disabled={actionProcessingId === candidate.id}
                    onClick={() => handleAction('CONFIRM_DUPLICATE', candidate.id)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-rose-200 cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Confirm Duplicate (Reject & Close)</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionProcessingId === candidate.id}
                    onClick={() => handleAction('KEEP_SEPARATE', candidate.id)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Keep as Separate Sibling / Child</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: FAMILY ACCOUNTS & CHILDREN */}
      {activeTab === 'families' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by family, parent name, mobile, or child name..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {filteredFamilies.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No matching families found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredFamilies.map((fam) => (
                <div
                  key={fam.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-subtle space-y-5"
                >
                  {/* Family Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-lg font-black text-slate-900">{fam.familyName || `${fam.parentName} Family`}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                          {fam.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Parent / Guardian: <strong className="text-slate-800">{fam.parentName}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      {fam.parentPhones?.map((phone: string, i: number) => (
                        <div key={i} className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-mono font-bold text-slate-800">{phone}</span>
                        </div>
                      ))}
                      {fam.parentEmails?.map((email: string, i: number) => (
                        <div key={i} className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Mail className="w-3.5 h-3.5 text-teal-600" />
                          <span>{email}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Children Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Children / Students in this Family ({fam.totalChildren})
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Enrolled students */}
                      {fam.enrolledChildren.map((child: any) => (
                        <div
                          key={child.id}
                          className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-950">
                              {child.studentCode}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              ENROLLED ACTIVE
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{child.name}</h4>
                          <p className="text-slate-600">Grade {child.classGrade} • {child.schoolName}</p>
                          <p className="text-[11px] text-teal-800 font-mono">{child.email}</p>
                        </div>
                      ))}

                      {/* Registrations */}
                      {fam.registrationChildren.map((child: any) => (
                        <div
                          key={child.id}
                          className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                            child.duplicateStatus === 'POSSIBLE_DUPLICATE'
                              ? 'bg-amber-50/70 border-amber-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-900">
                              {child.studentCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                child.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : child.duplicateStatus === 'POSSIBLE_DUPLICATE'
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {child.duplicateStatus === 'POSSIBLE_DUPLICATE'
                                ? 'POSSIBLE DUP'
                                : child.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{child.name}</h4>
                          <p className="text-slate-600">Grade {child.classGrade} • {child.schoolName}</p>
                          <p className="text-[11px] text-slate-500">App ID: {child.id}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DUPLICATE AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Duplicate Application Audit Trail</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every duplicate attempt blocked or flagged by the detection engine is securely logged here.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
              {data.duplicateLogs.length} Records
            </span>
          </div>

          {data.duplicateLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No duplicate attempts recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Parent Contact</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reason & Signals</th>
                    <th className="py-3 px-4">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.duplicateLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{log.studentName}</td>
                      <td className="py-3 px-4 font-mono">
                        {log.parentPhone}
                        {log.parentEmail && <span className="block text-[11px] text-slate-400">{log.parentEmail}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">{log.confidence}%</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.status === 'BLOCKED'
                              ? 'bg-rose-100 text-rose-800'
                              : log.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-medium text-slate-800 truncate">{log.reason}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {log.matchSignals?.join(' • ')}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
