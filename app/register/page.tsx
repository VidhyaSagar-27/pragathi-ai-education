'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send,
  UserCheck,
  School,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    studentName: '',
    classGrade: '',
    schoolName: '',
    parentName: '',
    mobileNumber: '',
    email: '',
    location: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit student registration.');
      }

      setSubmittedName(formData.studentName);
      setStatus('success');
      setSuccessMessage(data.message);
      setFormData({
        studentName: '',
        classGrade: '',
        schoolName: '',
        parentName: '',
        mobileNumber: '',
        email: '',
        location: '',
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during submission.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {status === 'success' ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-emerald-400 shadow-xl max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                Application Received
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Enrollment Submitted!
              </h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Thank you, <strong>{submittedName}</strong>. Your enrollment registration has been submitted to PRAGATHI AI administrators for review.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>What happens next?</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Administrators will review and accept your application.</li>
                <li>Your student account will be activated with default credentials.</li>
                <li>You will receive portal access to all 7 modules, quizzes, and labs.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="px-6 py-3 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center justify-center space-x-2"
              >
                <span>Proceed to Portal Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setStatus('idle')}
                className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 transition"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-teal-900 text-white p-6 sm:p-8">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Official Student Registration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Enroll in PRAGATHI AI
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Join India&apos;s premier school AI education platform. Fill out the application below to begin your journey through all 7 curriculum modules, hands-on labs, and certification.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Submission Error</p>
                    <p className="text-rose-700 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Student Name & Grade */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Class / Grade *
                  </label>
                  <select
                    required
                    value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                  >
                    <option value="">Select Grade</option>
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
              </div>

              {/* School Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="e.g. Delhi Public School / Narayana High School"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Parent Name & Phone */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent / Guardian Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Email & Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Town / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Hyderabad / Bangalore"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Information Note */}
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-800 leading-relaxed">
                <strong>Important:</strong> Applications are reviewed by PRAGATHI AI administrators. Once accepted, your login account will be generated and you can log in to start learning.
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3.5 px-6 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{status === 'loading' ? 'Submitting Application...' : 'Submit Student Application'}</span>
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Already registered and approved?{' '}
                  <Link href="/login" className="font-bold text-teal-700 hover:underline">
                    Sign in to Student Portal
                  </Link>
                </p>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
