'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Phone, Mail, Instagram, ShieldCheck } from 'lucide-react';
import { WebsiteSettings } from '@/lib/db/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
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
          Brand & Website Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure official contact numbers, institutional emails, social media handles, and branding assets.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Brand Identity & Coordinates
          </h2>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Brand and contact settings successfully updated!</span>
          </div>
        )}

        {/* Official Brand Identity */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Brand Naming
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={settings.websiteName}
                onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Program Name</label>
              <input
                type="text"
                required
                value={settings.programName}
                onChange={(e) => setSettings({ ...settings, programName: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Main Tagline</label>
            <input
              type="text"
              required
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        {/* Official Contact Channels (Section 40, 41, 42) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Official Contact Details
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone (+91) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={settings.phonePrimary}
                  onChange={(e) => setSettings({ ...settings, phonePrimary: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Secondary Phone (+91) *
              </label>
              <input
                type="text"
                required
                value={settings.phoneSecondary}
                onChange={(e) => setSettings({ ...settings, phoneSecondary: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Instagram Handle *
              </label>
              <input
                type="text"
                required
                value={settings.instagramHandle}
                onChange={(e) => setSettings({ ...settings, instagramHandle: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instagram Profile URL
            </label>
            <input
              type="url"
              value={settings.instagramUrl}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        {/* Brand Asset Preview */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Official Brand Logo Asset
          </h3>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-6">
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <img
                src="/images/logo.png"
                alt="PRAGATHI AI"
                className="h-[54px] w-auto object-contain"
              />
            </div>
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-800">Verified Official Asset</p>
              <p className="mt-0.5">Using high-resolution original brand monogram with preserved aspect ratio.</p>
              <p className="mt-0.5 text-teal-700">Desktop: 54px | Tablet: 48px | Mobile: 40px</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
