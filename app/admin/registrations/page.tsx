'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Check, X, Trash2, Calendar, School, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import { StudentRegistration } from '@/lib/db/types';

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Approval modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [activeReg, setActiveReg] = useState<StudentRegistration | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('Pragathi2026!');
  const [customEmail, setCustomEmail] = useState('');
  const [approvedResult, setApprovedResult] = useState<any | null>(null);

  const loadRegistrations = () => {
    setLoading(true);
    fetch('/api/admin/registrations')
      .then((r) => r.json())
      .then((d) => {
        setRegistrations(d.registrations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const handleOpenApprove = (reg: StudentRegistration) => {
    setActiveReg(reg);
    setCustomEmail(reg.email || `${reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pragathiai.student`);
    setGeneratedPassword('Pragathi2026!');
    setApprovedResult(null);
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReg) return;

    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeReg.id,
          action: 'APPROVE',
          initialPassword: generatedPassword,
          customEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve registration');

      setApprovedResult(data.createdStudent);
      loadRegistrations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this student application?')) return;
    await fetch('/api/admin/registrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'REJECT' }),
    });
    loadRegistrations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this registration record?')) return;
    await fetch(`/api/admin/registrations?id=${id}`, { method: 'DELETE' });
    loadRegistrations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Student Registration Applications
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review incoming enrollment submissions from students and parents. Approving an application automatically provisions their student portal account.
        </p>
      </div>

      {registrations.length > 0 ? (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-slate-900">{reg.studentName}</h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      reg.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : reg.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {reg.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">School & Grade</span>
                    <strong className="text-slate-800">{reg.schoolName}</strong> (Grade {reg.classGrade})
                  </div>
                  <div>
                    <span className="text-slate-400 block">Parent / Guardian</span>
                    <strong className="text-slate-800">{reg.parentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mobile Phone</span>
                    <strong className="text-slate-800">{reg.mobileNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Location & Date</span>
                    <span>{reg.location} • {new Date(reg.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {reg.email && (
                  <div className="text-xs text-slate-500">
                    Parent/Student Email: <span className="text-teal-700 font-medium">{reg.email}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {reg.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleOpenApprove(reg)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Create Account</span>
                    </button>
                    <button
                      onClick={() => handleReject(reg.id)}
                      className="inline-flex items-center space-x-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(reg.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  title="Delete Application Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">0 Registration Applications</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            No student enrollment applications pending. Submissions from the public registration form will arrive here for approval.
          </p>
        </div>
      )}

      {/* Approval Modal */}
      {approveModalOpen && activeReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Approve Student: {activeReg.studentName}
              </h3>
              <button onClick={() => setApproveModalOpen(false)}>✕</button>
            </div>

            {approvedResult ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-2">
                  <p className="font-bold text-sm">Account Successfully Provisioned!</p>
                  <p className="text-xs">
                    Login Email: <code className="bg-white px-1.5 py-0.5 rounded font-mono text-emerald-950 font-bold">{approvedResult.email}</code>
                  </p>
                  <p className="text-xs">
                    Password: <code className="bg-white px-1.5 py-0.5 rounded font-mono text-emerald-950 font-bold">{approvedResult.temporaryPassword}</code>
                  </p>
                </div>
                <button
                  onClick={() => setApproveModalOpen(false)}
                  className="w-full py-2.5 bg-brand-navy text-white text-xs font-semibold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmApprove} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Verify or set the credentials to provision for <strong>{activeReg.studentName}</strong>:
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temporary Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={generatedPassword}
                    onChange={(e) => setGeneratedPassword(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setApproveModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Confirm & Create Student Account
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
