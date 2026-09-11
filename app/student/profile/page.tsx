'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  School,
  Phone,
  Mail,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Sparkles,
  Save,
  Image as ImageIcon,
} from 'lucide-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  // Password update form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  const loadProfile = () => {
    setLoading(true);
    fetch('/api/auth/profile?t=' + Date.now())
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setProfile(data.user);
          setPhotoUrl(data.user.studentDetails?.photoUrl || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    setPhotoSaving(true);
    setPhotoMessage(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update photo');
      setPhotoMessage('Student profile photo saved successfully!');
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Error saving photo');
    } finally {
      setPhotoSaving(false);
    }
  };

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
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

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

  const currentPhoto = photoUrl || profile?.studentDetails?.photoUrl;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Student Profile & Identity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your verified student credentials, upload your identity photo, and update your security password.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile & Photo Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-teal-50 border-2 border-teal-500 flex items-center justify-center text-teal-700 font-black text-2xl shadow-inner">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={profile?.name || 'Student'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.name?.charAt(0) || 'S'
                )}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute -bottom-2 -right-2 p-1.5 bg-slate-900 hover:bg-teal-600 text-white rounded-xl cursor-pointer shadow-md transition"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">{profile?.name}</h2>
              <span className="inline-block mt-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100/70 text-teal-800">
                PRAGATHI AI Student ID
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                ID: {profile?.id?.substring(0, 16)}...
              </p>
            </div>
          </div>

          {/* Photo URL or Upload action */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Student Photo (Upload or Image URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Paste photo URL or click camera icon to upload file..."
                className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
              />
              <button
                onClick={handleSavePhoto}
                disabled={photoSaving}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
              >
                {photoSaving ? 'Saving...' : 'Save Photo'}
              </button>
            </div>
            {photoMessage && (
              <p className="text-xs font-bold text-emerald-700">{photoMessage}</p>
            )}
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100 text-sm">
            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block font-bold">Email Address</span>
                <span className="text-slate-800 font-semibold">{profile?.email}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <School className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block font-bold">School & Cohort</span>
                <span className="text-slate-800 font-semibold">
                  {profile?.studentDetails?.schoolName || 'Enrolled School'} • Grade {profile?.studentDetails?.classGrade || 'N/A'}
                </span>
                <span className="block text-[11px] text-teal-700 font-medium">
                  Group: {profile?.studentDetails?.group || 'Foundation Batch A'}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block font-bold">Parent / Guardian</span>
                <span className="text-slate-800 font-semibold">
                  {profile?.studentDetails?.parentName || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block font-bold">Contact Mobile</span>
                <span className="text-slate-800 font-semibold">{profile?.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block font-bold">Location</span>
                <span className="text-slate-800 font-semibold">{profile?.studentDetails?.location || 'India'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-black text-lg mb-1">
              <Lock className="w-5 h-5 text-teal-600" />
              <h3>Change Password</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Update your secret login password to keep your student account secure.
            </p>

            {pwStatus === 'success' && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Password updated successfully!</span>
              </div>
            )}

            {pwStatus === 'error' && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwStatus === 'loading'}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition disabled:opacity-50"
                >
                  {pwStatus === 'loading' ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
