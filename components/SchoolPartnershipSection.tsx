'use client';

import React, { useState } from 'react';
import { School, Building2, User, Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SchoolPartnershipSection() {
  const [formData, setFormData] = useState({
    schoolName: '',
    contactPerson: '',
    designation: '',
    mobileNumber: '',
    email: '',
    schoolLocation: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/partnership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit partnership request.');
      }

      setStatus('success');
      setFormData({
        schoolName: '',
        contactPerson: '',
        designation: '',
        mobileNumber: '',
        email: '',
        schoolLocation: '',
        message: '',
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <section id="partnership" className="py-20 lg:py-28 bg-white border-b border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Context Column */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-100 select-none cursor-default">
              Institutional Collaboration
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Bring PRAGATHI AI to Your School
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Equip your institution with a turnkey Artificial Intelligence education initiative. We provide structured curriculum, trained faculty assistance, student learning access, and practical project guidance.
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Seamless Integration</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Fits cleanly into academic calendars, STEM clubs, or after-school workshops.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Structured 7-Module Syllabus</h4>
                  <p className="text-xs text-slate-500 mt-0.5">From core algorithms to generative AI tools and ethics.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-brand-purple flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Verified Program Certification</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Recognizes participating school leadership and high-performing students.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Partnership Form */}
          <div className="lg:col-span-7">
            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-card">
              
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Institutional Partnership Inquiry
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Submit your school details to schedule an exploratory discussion with our leadership.
              </p>

              {status === 'success' ? (
                <div className="p-6 bg-teal-50 border border-teal-200 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-teal-900">Partnership Request Received</h4>
                  <p className="text-sm text-teal-800 max-w-md mx-auto">
                    Thank you! Your school partnership inquiry has been logged. Our academic relations team will contact you within 24–48 hours.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-3 text-xs font-semibold text-teal-700 underline hover:text-teal-900"
                  >
                    Submit another inquiry
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
                        School Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.schoolName}
                          onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                          placeholder="e.g. St. Xavier High School"
                          className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Designation *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. Principal / Academic Director / HOD"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Official Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. principal@school.edu.in"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        School Location (City & State) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.schoolLocation}
                        onChange={(e) => setFormData({ ...formData, schoolLocation: e.target.value })}
                        placeholder="e.g. Hyderabad, Telangana"
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message / Student Batch Scope (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share expected batch size, grade levels (e.g. Grades 6-10), or specific questions."
                      className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-navy to-brand-teal hover:from-slate-900 hover:to-teal-600 transition shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{status === 'loading' ? 'Submitting...' : 'Submit Partnership Request'}</span>
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
