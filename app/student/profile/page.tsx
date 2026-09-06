'use client';

import React, { useState, useEffect } from 'react';
import { User, School, Phone, Mail, MapPin, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password update form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setProfile(data.user);
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
      setPwError(err.message || 'Could not update password');
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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your enrolled school details and manage your account credentials.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold text-xl">
              {profile?.name ? profile.name.charAt(0) : 'S'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile?.name}</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-teal-100/70 text-teal-800">
                PRAGATHI AI Student
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 text-sm">
            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block">Email Address</span>
                <span className="text-slate-800 font-medium">{profile?.email}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <School className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block">School & Grade</span>
                <span className="text-slate-800 font-medium">
                  {profile?.studentDetails?.schoolName || 'Enrolled School'} • Grade {profile?.studentDetails?.classGrade || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block">Parent / Guardian</span>
                <span className="text-slate-800 font-medium">
                  {profile?.studentDetails?.parentName || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block">Contact Phone</span>
                <span className="text-slate-800 font-medium">{profile?.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block">Location</span>
                <span className="text-slate-800 font-medium">{profile?.studentDetails?.location || 'India'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg mb-1">
              <Lock className="w-5 h-5 text-teal-600" />
              <h3>Change Password</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Update your secret login password to keep your student account secure.
            </p>

            {pwStatus === 'success' && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            {pwStatus === 'error' && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwStatus === 'loading'}
                  className="w-full py-2.5 bg-brand-navy hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition"
                >
                  {pwStatus === 'loading' ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
