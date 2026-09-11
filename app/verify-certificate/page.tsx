'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Search, Award, CheckCircle2, XCircle, Calendar, User, ExternalLink, Printer } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams ? (searchParams.get('id') || '') : '';

  const [certInput, setCertInput] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (idToVerify: string) => {
    const cleanId = idToVerify.trim();
    if (!cleanId) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch(`/api/certificates/verify?id=${encodeURIComponent(cleanId)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setErrorMsg(data.message || 'Certificate not found in official registry.');
      } else {
        setResult(data.certificate);
      }
    } catch (err: any) {
      setErrorMsg('Failed to query certificate registry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      handleVerify(initialId);
    }
  }, [initialId]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full space-y-8">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-3 text-teal-700">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Official Credential Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Verify the authenticity of digital certificates issued by PRAGATHI AI & Robotics Institute. Enter the unique 8-character verification ID printed on the credential.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(certInput);
            }}
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. CERT-PRAGATHI-A8B9C1"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition shrink-0"
            >
              {loading ? 'Verifying...' : 'Verify Record'}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-xs sm:text-sm">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Credential Verification Failed</p>
              <p className="text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Verification Success Card */}
        {result && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-emerald-400 shadow-xl max-w-2xl mx-auto relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Authentic Academic Credential
                  </span>
                  <span className="font-mono text-xs text-slate-500">{result.certificateNumber || result.certificateId}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                Cryptographically Verified
              </span>
            </div>

            <div className="py-6 space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-medium">Recipient Student:</span>
                <strong className="text-base font-black text-slate-900">{result.studentName}</strong>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-medium">Completed Program:</span>
                <strong className="font-bold text-teal-800 text-right">{result.programName || result.title}</strong>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-medium">Issue Date:</span>
                <strong className="font-semibold text-slate-800">
                  {result.issueDate || (result.issuedAt ? new Date(result.issuedAt).toLocaleDateString('en-US', { dateStyle: 'long' }) : 'Verified')}
                </strong>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-medium">Authorized Issuer:</span>
                <span className="font-bold text-slate-800">{result.issuer || 'PRAGATHI AI & Robotics Institute'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Verification Record</span>
              </button>

              <span className="text-[10px] text-slate-400 font-mono">
                Verified at {new Date(result.verifiedAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">Loading verification engine...</div>}>
      <VerifyCertificateContent />
    </Suspense>
  );
}
