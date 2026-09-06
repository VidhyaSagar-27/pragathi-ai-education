'use client';

import React, { useState } from 'react';
import { Phone, Mail, Instagram, Send, CheckCircle2, AlertCircle, MapPin, Clock } from 'lucide-react';

interface ContactSectionProps {
  settings?: {
    phonePrimary?: string;
    phoneSecondary?: string;
    email?: string;
    instagramHandle?: string;
    instagramUrl?: string;
  };
}

export default function ContactSection({ settings }: ContactSectionProps) {
  const phone1 = settings?.phonePrimary || '+91 9618611522';
  const phone2 = settings?.phoneSecondary || '+91 6281738986';
  const email = settings?.email || 'hello.pragathiai@gmail.com';
  const instaHandle = settings?.instagramHandle || '@pragathi_ai';
  const instaUrl = settings?.instagramUrl || 'https://instagram.com/pragathi_ai';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-100 select-none cursor-default">
            Reach Out
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Get in Touch with PRAGATHI AI
          </h2>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            Have questions about the Foundation Program, enrollment, or institutional schedules? Our education coordinators are here to assist.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Official Contact Info Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-brand-navy via-slate-900 to-teal-950 text-white shadow-elevated">
              <h3 className="text-2xl font-bold text-white mb-2">
                Official Channels
              </h3>
              <p className="text-sm text-slate-300 mb-8 leading-relaxed">
                Connect directly with PRAGATHI AI through our verified contact numbers and official electronic mail.
              </p>

              <div className="space-y-6">
                {/* Phone Numbers */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 text-teal-300 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone (Voice & WhatsApp)</p>
                    <div className="mt-1 space-y-1">
                      <a
                        href={`tel:${phone1.replace(/\s+/g, '')}`}
                        className="block text-base font-bold text-white hover:text-teal-300 transition-colors"
                      >
                        {phone1}
                      </a>
                      <a
                        href={`tel:${phone2.replace(/\s+/g, '')}`}
                        className="block text-base font-bold text-white hover:text-teal-300 transition-colors"
                      >
                        {phone2}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 text-teal-300 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Official Email</p>
                    <a
                      href={`mailto:${email}`}
                      className="block text-base font-bold text-white hover:text-teal-300 transition-colors mt-1"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                {/* Instagram Handle */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 text-teal-300 flex items-center justify-center shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Official Instagram</p>
                    <a
                      href={instaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-base font-bold text-white hover:text-teal-300 transition-colors mt-1"
                    >
                      {instaHandle}
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start space-x-4 pt-4 border-t border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-white/10 text-teal-300 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inquiry Hours</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">
                      Monday to Saturday: 9:00 AM – 6:30 PM IST
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Contact Message Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-subtle">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Send a Message
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Fill out the form below and an education advisor will respond promptly.
              </p>

              {status === 'success' ? (
                <div className="p-8 bg-teal-50 border border-teal-200 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-teal-900">Message Received</h4>
                  <p className="text-sm text-teal-800 max-w-md mx-auto">
                    Thank you! Your message has been stored in our system. A representative will get back to you shortly.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-3 text-xs font-semibold text-teal-700 underline hover:text-teal-900"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {status === 'error' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Full name"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your.email@example.com"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subject / Topic
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. Program Inquiry / Syllabus question"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Type your message or inquiry here..."
                      className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-navy to-brand-teal hover:from-slate-900 hover:to-teal-600 transition shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{status === 'loading' ? 'Sending Message...' : 'Send Message'}</span>
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
