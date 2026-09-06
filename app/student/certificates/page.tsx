'use client';

import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle2, Download } from 'lucide-react';
import { CertificateItem } from '@/lib/db/types';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In our clean start, no certificates are fabricated
    setLoading(false);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          My Program Certificates
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Official digital certificates awarded for completing the Pragathi AI Foundation Program modules and capstones.
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{cert.programName}</h3>
                <p className="text-xs text-slate-500 mt-1">Certificate #{cert.certificateNumber}</p>
                <p className="text-xs text-slate-500 mt-0.5">Issued on {cert.issueDate}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Authenticity</span>
                </span>
                <a
                  href={`/certificate/${cert.certificateNumber}`}
                  className="text-xs font-bold text-brand-navy hover:underline"
                >
                  View Credential
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Certificates Issued Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Official completion certificates are issued upon successfully completing the 7 Foundation Modules and required evaluations.
          </p>
          <div className="mt-6 inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Cryptographically verifiable upon issuance</span>
          </div>
        </div>
      )}
    </div>
  );
}
