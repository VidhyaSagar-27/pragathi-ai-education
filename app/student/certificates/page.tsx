'use client';

import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle2, Download, Printer, ExternalLink, Sparkles } from 'lucide-react';
import { CertificateItem } from '@/lib/db/types';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

  useEffect(() => {
    fetch('/api/student/certificates?t=' + Date.now())
      .then((r) => r.json())
      .then((data) => {
        setCertificates(data.certificates || []);
        if (data.certificates && data.certificates.length > 0) {
          setPreviewCert(data.certificates[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Academic Credentials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Official Program Certificates
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Official digital certificates awarded for completing PRAGATHI AI foundation modules, exams, and capstone practicals.
          </p>
        </div>

        {previewCert && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        )}
      </div>

      {certificates.length > 0 ? (
        <div className="space-y-8">
          {/* Certificate Render (High-Resolution Printable Frame) */}
          {previewCert && (
            <div className="bg-white border-8 border-double border-teal-800 rounded-3xl p-8 sm:p-14 shadow-2xl relative max-w-3xl mx-auto text-center space-y-6 overflow-hidden print:border-4 print:p-6">
              <div className="absolute top-4 right-4 flex items-center space-x-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Verified Credential</span>
              </div>

              <div>
                <img
                  src="/images/logo.png"
                  alt="PRAGATHI AI"
                  className="h-16 w-auto mx-auto object-contain mb-2"
                />
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 block">
                  PRAGATHI AI ACADEMY
                </span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Future-Ready Artificial Intelligence Education
                </p>
              </div>

              <div className="py-2">
                <p className="text-xs text-slate-500 uppercase tracking-widest">
                  This is proudly presented to
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-serif mt-2 tracking-tight">
                  {previewCert.studentName}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-amber-400 mx-auto mt-3 rounded-full"></div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                for outstanding academic performance and successful completion of the coursework, assessments, and practical exercises in
              </p>

              <h3 className="text-lg sm:text-xl font-bold text-teal-900 font-serif">
                {previewCert.programName}
              </h3>

              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-6 max-w-md mx-auto text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Issue Date</span>
                  <span className="font-bold text-slate-800">{previewCert.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Credential ID</span>
                  <span className="font-mono font-bold text-teal-800">{previewCert.certificateNumber}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-center space-x-1">
                <span>Public Verification: </span>
                <a
                  href={`/verify-certificate?id=${previewCert.certificateNumber}`}
                  target="_blank"
                  className="text-teal-700 font-bold hover:underline inline-flex items-center space-x-0.5"
                >
                  <span>pragathiai.com/verify-certificate</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          )}

          {/* List of other certificates if multiple */}
          {certificates.length > 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  onClick={() => setPreviewCert(cert)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    previewCert?.id === cert.id
                      ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <h4 className="font-bold text-slate-900 text-sm">{cert.programName}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">ID: {cert.certificateNumber}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Complete an Assessment to Earn Certificates</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Official verifiable completion certificates are automatically awarded upon passing any module assessment in the Quizzes & Challenges portal!
          </p>
        </div>
      )}
    </div>
  );
}
