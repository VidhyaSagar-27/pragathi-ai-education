'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Phone, Mail, Instagram, ShieldCheck, MessageSquare, Send, Zap, Check, AlertCircle } from 'lucide-react';
import { WebsiteSettings } from '@/lib/db/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // WhatsApp Automation Testing State
  const [testPhone, setTestPhone] = useState('9346056745');
  const [testType, setTestType] = useState<'CREDENTIALS' | 'OTP' | 'CUSTOM'>('CREDENTIALS');
  const [testCustomMsg, setTestCustomMsg] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [waResult, setWaResult] = useState<any | null>(null);
  const [waError, setWaError] = useState('');

  const loadSettings = () => {
    setLoading(true);
    fetch(`/api/admin/settings?_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
    const onFocus = () => loadSettings();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
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

  const handleSendTestWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingWa(true);
    setWaResult(null);
    setWaError('');

    let msg = '';
    if (testType === 'CREDENTIALS') {
      msg = `*PRAGATHI AI EDUCATION - ADMISSION APPROVED*\n\nDear Student,\nCongratulations! Your application has been approved by the administration.\n\nHere are your official login credentials:\nStudent Name: Student\nLogin Email / ID: student@pragathiai.student\nPassword: Pragathi2026!\nStudent Portal: https://pragathi-ai-education.vercel.app/login\n\nPlease login and begin your learning journey!`;
    } else if (testType === 'OTP') {
      msg = `Your PRAGATHI AI verification code for portal access is: ${Math.floor(100000 + Math.random() * 900000)}. Valid for 10 minutes. Do not share this code.`;
    } else {
      msg = testCustomMsg || 'Hello from PRAGATHI AI Automated Notification System! Your learning journey awaits.';
    }

    try {
      const res = await fetch('/api/notifications/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientMobile: testPhone,
          message: msg,
          templateName: `PRAGATHI AI ${testType} Automated Alert`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch WhatsApp message');
      setWaResult(data);
    } catch (err: any) {
      setWaError(err.message || 'Error triggering automated WhatsApp message');
    } finally {
      setSendingWa(false);
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

      {/* WhatsApp Message Automation Engine Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  WhatsApp Message Automation System
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Active & Automated
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated multi-channel dispatch for credentials, admission updates, verification OTPs, and exam scorecards.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Automated Trigger Pipelines */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Admission Credentials</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Triggers automatically when admin approves an application. Sends login email, password, and portal link.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <Zap className="w-4 h-4 text-teal-600" />
              <span>Verification OTP Alerts</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Dispatches 6-digit verification codes for password resets, student portal logins, and administrative authorizations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <Zap className="w-4 h-4 text-brand-purple" />
              <span>Exam Results & Scores</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Sends instant scorecard alerts upon exam submission with student score, percentage, and scorecard portal URL.
            </p>
          </div>
        </div>

        {/* Live WhatsApp Test Dispatch Tool */}
        <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-4">
          <div className="flex items-center space-x-2">
            <Send className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              Test WhatsApp Automation Dispatch
            </h3>
          </div>

          {waResult && (
            <div className="p-3 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Automated WhatsApp Message Dispatched Successfully!</span>
              </p>
              <div className="grid sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-600 pt-1">
                <div>Message ID: <strong className="text-slate-900">{waResult.messageId}</strong></div>
                <div>Provider: <strong className="text-emerald-700">{waResult.provider}</strong></div>
                <div>Status: <strong className="text-emerald-700">{waResult.status}</strong></div>
              </div>
            </div>
          )}

          {waError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{waError}</span>
            </div>
          )}

          <form onSubmit={handleSendTestWhatsApp} className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Mobile (10 Digits)
                </label>
                <input
                  type="tel"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 9346056745"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Automated Template
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as any)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CREDENTIALS">Student Admission Credentials</option>
                  <option value="OTP">Security Verification OTP</option>
                  <option value="CUSTOM">Custom Administrative Alert</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={sendingWa || !testPhone.trim()}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingWa ? 'Triggering Dispatch...' : 'Dispatch Automated WhatsApp'}</span>
                </button>
              </div>
            </div>

            {testType === 'CUSTOM' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Message Content
                </label>
                <textarea
                  rows={2}
                  value={testCustomMsg}
                  onChange={(e) => setTestCustomMsg(e.target.value)}
                  placeholder="Enter custom announcement or notification to send via WhatsApp..."
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
