'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InstructorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setProfile(d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      setPwStatus('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      setPwStatus('error');
      return;
    }

    setPwStatus('loading');
    setPwError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.id, password: newPassword }),
      });

      if (!res.ok) throw new Error('Failed to update password');

      setPwStatus('success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwStatus('error');
      setPwError(err.message || 'Error updating password');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Instructor Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your faculty credentials and update your portal password.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl border border-teal-100">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile?.name}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-navy text-white">
                Faculty Instructor
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-sm space-y-3">
            <div>
              <span className="text-xs text-slate-400 block">Email Address</span>
              <span className="text-slate-800 font-medium">{profile?.email}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Designation</span>
              <span className="text-slate-800 font-medium">
                {profile?.instructorDetails?.designation || 'AI Curriculum Faculty'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Assigned Syllabus</span>
              <span className="text-teal-700 font-medium">Modules 01 - 07</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-1">
              <Lock className="w-4 h-4 text-teal-600" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Update your secret credentials.</p>

            {pwStatus === 'success' && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated!</span>
              </div>
            )}

            {pwStatus === 'error' && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={pwStatus === 'loading'}
                className="w-full py-2.5 bg-brand-navy hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                {pwStatus === 'loading' ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Request Administration Assistance Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Request Anything from Administration
            </h3>
            <p className="text-xs text-slate-500">
              Need new credentials, curriculum resources, or account updates? Request directly from admin.
            </p>
          </div>
        </div>

        <InstructorHelpForm profile={profile} />
      </div>
    </div>
  );
}

function InstructorHelpForm({ profile }: { profile: any }) {
  const [reqType, setReqType] = useState('CREDENTIALS_REQUEST');
  const [reqSubject, setReqSubject] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/support/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName: profile?.name || 'Faculty Instructor',
          requesterRole: 'INSTRUCTOR',
          requesterPhone: profile?.phone,
          requesterEmail: profile?.email,
          type: reqType,
          subject: reqSubject.trim() || `Instructor Request: ${reqType}`,
          message: reqMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setStatus('success');
      setReqSubject('');
      setReqMessage('');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Error submitting request');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-xs">
      {status === 'success' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your request has been submitted to the admin team. We will reply shortly.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Request Type</label>
          <select
            value={reqType}
            onChange={(e) => setReqType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
          >
            <option value="CREDENTIALS_REQUEST">Credentials / User ID Request</option>
            <option value="PASSWORD_RESET">Password Reset Request</option>
            <option value="GENERAL_HELP">Course / System Assistance</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Subject</label>
          <input
            type="text"
            required
            value={reqSubject}
            onChange={(e) => setReqSubject(e.target.value)}
            placeholder="e.g. Need portal login credentials"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Details / Message</label>
        <textarea
          rows={3}
          required
          value={reqMessage}
          onChange={(e) => setReqMessage(e.target.value)}
          placeholder="Describe what you need from administration..."
          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          {status === 'loading' ? 'Submitting...' : 'Send Request to Admin'}
        </button>
      </div>
    </form>
  );
}
