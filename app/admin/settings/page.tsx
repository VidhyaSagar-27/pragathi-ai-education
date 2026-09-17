'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  Instagram,
  ShieldCheck,
  MessageSquare,
  Send,
  Zap,
  Check,
  AlertCircle,
  Key,
  Lock,
  Server,
  Globe,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { WebsiteSettings, WhatsAppConfig, EmailConfig, GmailConfig } from '@/lib/db/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // WhatsApp Automation Testing State
  const [testPhone, setTestPhone] = useState('9618611522');
  const [testType, setTestType] = useState<'CREDENTIALS' | 'OTP' | 'CUSTOM'>('CREDENTIALS');
  const [testCustomMsg, setTestCustomMsg] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [waResult, setWaResult] = useState<any | null>(null);
  const [waError, setWaError] = useState('');

  // Email Automation Testing State
  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [testEmailSubject, setTestEmailSubject] = useState('PRAGATHI AI System Test Notice');
  const [testEmailBody, setTestEmailBody] = useState(
    'This is a verification dispatch from the PRAGATHI AI automated notification system.'
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<any | null>(null);
  const [emailError, setEmailError] = useState('');

  const loadSettings = () => {
    setLoading(true);
    fetch(`/api/admin/settings?_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const s: WebsiteSettings = d.settings || {};
        if (!s.whatsappConfig) {
          s.whatsappConfig = {
            provider: 'META',
            metaAccessToken: '',
            metaPhoneNumberId: '',
            twilioAccountSid: '',
            twilioAuthToken: '',
            twilioFromNumber: '',
          };
        }
        if (!s.emailConfig) {
          s.emailConfig = {
            provider: 'RESEND',
            resendApiKey: '',
            fromEmail: 'admissions@pragathiai.com',
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPass: '',
          };
        }
        if (!s.gmailConfig) {
          s.gmailConfig = {
            clientId: '',
            clientSecret: '',
            authorizedEmail: 'hello.pragathiai@gmail.com',
          };
        }
        setSettings(s);
        if (s.email && !testEmailAddr) {
          setTestEmailAddr(s.email);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const [gmailBanner, setGmailBanner] = useState<string | null>(null);
  const [gmailErrorBanner, setGmailErrorBanner] = useState<string | null>(null);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);

  useEffect(() => {
    loadSettings();
    const onFocus = () => loadSettings();
    window.addEventListener('focus', onFocus);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('gmail') === 'connected') {
        const acc = params.get('account') || 'hello.pragathiai@gmail.com';
        setGmailBanner(`Google account (${acc}) successfully connected via Google OAuth 2.0! Automated emails will now be dispatched from this account.`);
      }
      if (params.get('gmail_error')) {
        setGmailErrorBanner(`Google OAuth Error: ${params.get('gmail_error')}`);
      }
    }

    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const updateWhatsApp = (patch: Partial<WhatsAppConfig>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      whatsappConfig: {
        ...(settings.whatsappConfig || {}),
        ...patch,
      },
    });
  };

  const updateEmail = (patch: Partial<EmailConfig>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      emailConfig: {
        ...(settings.emailConfig || {}),
        ...patch,
      },
    });
  };

  const updateGmail = (patch: Partial<GmailConfig>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      gmailConfig: {
        ...(settings.gmailConfig || {}),
        ...patch,
      },
    });
  };

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
      setTimeout(() => setSuccess(false), 3500);
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
      msg = `*PRAGATHI AI EDUCATION - ADMISSION APPROVED*\n\nDear Student,\nCongratulations! Your application has been approved by the administration.\n\nHere are your official login credentials:\nStudent Name: Student\nLogin Email / ID: student@pragathiai.student\nPassword: Pragathi2026!\n\n👉 Direct 1-Click Access to Student Portal:\nhttps://pragathi-ai-education.vercel.app/register?tab=status\n\n👉 Portal Login:\nhttps://pragathi-ai-education.vercel.app/login?email=student@pragathiai.student&role=STUDENT\n\nPlease access your student dashboard and begin your learning journey!`;
    } else if (testType === 'OTP') {
      msg = `Your PRAGATHI AI verification code for portal access is: ${Math.floor(
        100000 + Math.random() * 900000
      )}. Valid for 10 minutes. Do not share this code.`;
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

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    setEmailResult(null);
    setEmailError('');

    try {
      const res = await fetch('/api/admin/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CUSTOM_MESSAGE',
          recipientEmail: testEmailAddr,
          recipientName: 'Valued User',
          customSubject: testEmailSubject,
          customMessage: testEmailBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch test email');
      setEmailResult(data);
    } catch (err: any) {
      setEmailError(err.message || 'Error sending test email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const wa = settings.whatsappConfig || {};
  const em = settings.emailConfig || {};
  const gm = settings.gmailConfig || {};

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Brand & Website Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure official contact numbers, WhatsApp Cloud API tokens, Google OAuth 2.0 Gmail automation, and branding coordinates.
        </p>
      </div>

      {gmailBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{gmailBanner}</span>
          </div>
          <button onClick={() => setGmailBanner(null)} className="text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      {gmailErrorBanner && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{gmailErrorBanner}</span>
          </div>
          <button onClick={() => setGmailErrorBanner(null)} className="text-rose-700 font-bold ml-2">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Brand Identity & System Gateways
          </h2>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Settings and API credentials successfully saved and activated!</span>
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
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Program Name</label>
              <input
                type="text"
                required
                value={settings.programName}
                onChange={(e) => setSettings({ ...settings, programName: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
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
              className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Official Contact Channels */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Official Contact Details
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone (+91) *
              </label>
              <input
                type="text"
                required
                value={settings.phonePrimary}
                onChange={(e) => setSettings({ ...settings, phonePrimary: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
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
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-500"
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
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
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
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
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
              className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* WhatsApp Gateway API Credentials */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              WhatsApp Gateway Configuration
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Configure your Meta WhatsApp Cloud API or Twilio credentials to enable direct server-side WhatsApp dispatch anytime.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Provider
              </label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="waProvider"
                    checked={wa.provider !== 'TWILIO'}
                    onChange={() => updateWhatsApp({ provider: 'META' })}
                    className="text-teal-600"
                  />
                  <span>Meta WhatsApp Cloud API (Recommended)</span>
                </label>
                <label className="inline-flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="waProvider"
                    checked={wa.provider === 'TWILIO'}
                    onChange={() => updateWhatsApp({ provider: 'TWILIO' })}
                    className="text-teal-600"
                  />
                  <span>Twilio WhatsApp</span>
                </label>
              </div>
            </div>

            {wa.provider !== 'TWILIO' ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meta System User Access Token (Permanent Token)
                  </label>
                  <input
                    type="password"
                    value={wa.metaAccessToken || ''}
                    onChange={(e) => updateWhatsApp({ metaAccessToken: e.target.value })}
                    placeholder="EAABw..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Generated from Meta for Developers → System Users with `whatsapp_business_messaging` permission.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={wa.metaPhoneNumberId || ''}
                    onChange={(e) => updateWhatsApp({ metaPhoneNumberId: e.target.value })}
                    placeholder="e.g. 103849102840192"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    value={wa.twilioAccountSid || ''}
                    onChange={(e) => updateWhatsApp({ twilioAccountSid: e.target.value })}
                    placeholder="AC..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Twilio Auth Token
                  </label>
                  <input
                    type="password"
                    value={wa.twilioAuthToken || ''}
                    onChange={(e) => updateWhatsApp({ twilioAuthToken: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    From WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={wa.twilioFromNumber || ''}
                    onChange={(e) => updateWhatsApp({ twilioFromNumber: e.target.value })}
                    placeholder="+14155238886"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Gateway API Credentials */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Email Gateway Configuration
              </h3>
            </div>
            {gm.refreshToken ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1.5 self-start sm:self-auto">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Connected: {gm.authorizedEmail || 'hello.pragathiai@gmail.com'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 self-start sm:self-auto">
                Gmail OAuth Not Connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Automated email sending from <strong>hello.pragathiai@gmail.com</strong> via Google OAuth 2.0 Gmail API, with Resend and SMTP as optional fallbacks.
          </p>

          {/* 1. Official Google OAuth 2.0 (Gmail API) */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-teal-50/40 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Google OAuth 2.0 — Official Gmail API</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-100 text-teal-900 uppercase">
                    Primary Gateway
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sends admission credentials and scorecards directly from <strong>hello.pragathiai@gmail.com</strong> without manual sending.
                </p>
              </div>
              {gm.refreshToken && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Disconnect Google OAuth for hello.pragathiai@gmail.com?')) {
                      updateGmail({ refreshToken: '', accessToken: '' });
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition cursor-pointer"
                >
                  Disconnect Account
                </button>
              )}
            </div>

            {/* Exact Production Redirect URI Display */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Authorized Redirect URI (Add to Google Cloud Console):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://pragathi-ai-education.vercel.app/api/auth/google/callback');
                    setCopiedRedirectUri(true);
                    setTimeout(() => setCopiedRedirectUri(false), 2000);
                  }}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedRedirectUri ? 'Copied!' : 'Copy URI'}</span>
                </button>
              </div>
              <div className="font-mono text-xs bg-slate-50 px-3 py-2 rounded-lg text-slate-800 border border-slate-200 select-all break-all font-semibold">
                https://pragathi-ai-education.vercel.app/api/auth/google/callback
              </div>
              <p className="text-[11px] text-slate-400">
                In Google Cloud Console → <strong>APIs & Services → Credentials → Your OAuth 2.0 Client</strong>, paste this exact URI under <strong>Authorized redirect URIs</strong>.
              </p>
            </div>

            {/* Google Client ID and Secret */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Client ID *
                </label>
                <input
                  type="text"
                  value={gm.clientId || ''}
                  onChange={(e) => updateGmail({ clientId: e.target.value })}
                  placeholder="xxxxxxxx.apps.googleusercontent.com"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Client Secret *
                </label>
                <input
                  type="password"
                  value={gm.clientSecret || ''}
                  onChange={(e) => updateGmail({ clientSecret: e.target.value })}
                  placeholder="GOCSPX-••••••••••••"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                {gm.refreshToken ? (
                  <span className="text-emerald-700 font-bold flex items-center space-x-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Google OAuth 2.0 is active. Emails dispatch automatically from hello.pragathiai@gmail.com.</span>
                  </span>
                ) : (
                  <span>
                    1. Enter Client ID & Secret &nbsp;→&nbsp; 2. Click Save Settings &nbsp;→&nbsp; 3. Click Authorize.
                  </span>
                )}
              </div>

              <a
                href="/api/auth/google"
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-xs ${
                  gm.clientId && gm.clientSecret
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 cursor-pointer'
                    : 'bg-slate-400 cursor-not-allowed opacity-60'
                }`}
                onClick={(e) => {
                  if (!gm.clientId || !gm.clientSecret) {
                    e.preventDefault();
                    alert('Please enter your Google Client ID and Client Secret above, click "Save Settings", and then click Authorize.');
                  }
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>
                  {gm.refreshToken
                    ? 'Re-Authorize hello.pragathiai@gmail.com'
                    : 'Authorize hello.pragathiai@gmail.com'}
                </span>
              </a>
            </div>
          </div>

          {/* 2. Fallback Gateways (Resend & Custom SMTP) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Alternative Fallback Gateways (Resend / SMTP)
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resend API Key (Optional Fallback)
                </label>
                <input
                  type="password"
                  value={em.resendApiKey || ''}
                  onChange={(e) => updateEmail({ resendApiKey: e.target.value })}
                  placeholder="re_123456789..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Sender Email
                </label>
                <input
                  type="email"
                  value={em.fromEmail || 'hello.pragathiai@gmail.com'}
                  onChange={(e) => updateEmail({ fromEmail: e.target.value })}
                  placeholder="hello.pragathiai@gmail.com"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Custom SMTP Fallback (Optional) */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Custom SMTP Server (Optional Fallback)
              </span>
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={em.smtpHost || ''}
                    onChange={(e) => updateEmail({ smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Port</label>
                  <input
                    type="number"
                    value={em.smtpPort || 587}
                    onChange={(e) => updateEmail({ smtpPort: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Username</label>
                  <input
                    type="text"
                    value={em.smtpUser || ''}
                    onChange={(e) => updateEmail({ smtpUser: e.target.value })}
                    placeholder="hello.pragathiai@gmail.com"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
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

        {/* Save button at bottom */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings & Credentials'}</span>
          </button>
        </div>
      </form>

      {/* Live Testing Cards: WhatsApp & Email */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Live WhatsApp Test Dispatch Tool */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Test WhatsApp Automation Dispatch
            </h3>
          </div>

          {waResult && (
            waResult.status === 'SENT' ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs space-y-1">
                <p className="font-bold flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Real WhatsApp Message Dispatched Successfully!</span>
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-600 pt-1">
                  <div>Message ID: <strong className="text-slate-900">{waResult.messageId}</strong></div>
                  <div>Provider: <strong className="text-emerald-700">{waResult.provider}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl text-xs space-y-2">
                <p className="font-bold flex items-center space-x-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Simulation Mode Only — Not Delivered to Phone</span>
                </p>
                <p className="text-slate-600 leading-relaxed">
                  No real message was delivered to your phone because you have not entered your <strong>Meta WhatsApp Cloud API</strong> or <strong>Twilio</strong> credentials above yet. Servers cannot send WhatsApp messages without authorized API access.
                </p>
                <div className="pt-1">
                  <a
                    href={`https://wa.me/91${testPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      testType === 'CREDENTIALS'
                        ? `*PRAGATHI AI EDUCATION - ADMISSION APPROVED*\n\nDear Student,\nCongratulations! Your application has been approved by the administration.\n\nHere are your official login credentials:\nStudent Name: Student\nLogin Email / ID: student@pragathiai.student\nPassword: Pragathi2026!\n\n👉 Direct 1-Click Access to Student Portal:\nhttps://pragathi-ai-education.vercel.app/register?tab=status\n\n👉 Portal Login:\nhttps://pragathi-ai-education.vercel.app/login?email=student@pragathiai.student&role=STUDENT\n\nPlease access your student dashboard and begin your learning journey!`
                        : testCustomMsg || 'Hello from PRAGATHI AI Automated Notification System!'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
                  >
                    <span>👉 Open in WhatsApp Web & Send from Your Phone Now</span>
                  </a>
                </div>
              </div>
            )
          )}

          {waError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{waError}</span>
            </div>
          )}

          <form onSubmit={handleSendTestWhatsApp} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Mobile Number
              </label>
              <input
                type="tel"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 9618611522"
                className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Template
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CREDENTIALS">Student Admission Credentials</option>
                <option value="OTP">Security Verification OTP</option>
                <option value="CUSTOM">Custom Administrative Alert</option>
              </select>
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
                  placeholder="Enter custom message to send via WhatsApp..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={sendingWa || !testPhone.trim()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendingWa ? 'Dispatching...' : 'Dispatch Test WhatsApp'}</span>
            </button>
          </form>
        </div>

        {/* 2. Live Email Test Dispatch Tool */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Mail className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Test Email Automation Dispatch
            </h3>
          </div>

          {emailResult && (
            emailResult.delivery?.email?.dispatched ? (
              <div className="p-3 bg-teal-50 border border-teal-300 text-teal-900 rounded-xl text-xs space-y-1">
                <p className="font-bold flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-teal-600" />
                  <span>Real Email Dispatched Successfully!</span>
                </p>
                <p className="text-[11px] text-teal-700">
                  Delivered to {testEmailAddr} via configured email gateway.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl text-xs space-y-2">
                <p className="font-bold flex items-center space-x-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Simulation Mode Only — Not Delivered to Inbox</span>
                </p>
                <p className="text-slate-600 leading-relaxed">
                  No real email was sent to {testEmailAddr} because you have not connected <strong>Google OAuth (hello.pragathiai@gmail.com)</strong> or entered <strong>Resend / SMTP</strong> credentials above yet. Web servers require an authorized email provider to deliver messages.
                </p>
              </div>
            )
          )}

          {emailError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          <form onSubmit={handleSendTestEmail} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                required
                value={testEmailAddr}
                onChange={(e) => setTestEmailAddr(e.target.value)}
                placeholder="e.g. yourname@example.com"
                className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                required
                value={testEmailSubject}
                onChange={(e) => setTestEmailSubject(e.target.value)}
                className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message Body
              </label>
              <textarea
                rows={2}
                required
                value={testEmailBody}
                onChange={(e) => setTestEmailBody(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={sendingEmail || !testEmailAddr.trim()}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendingEmail ? 'Dispatching...' : 'Dispatch Test Email'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
