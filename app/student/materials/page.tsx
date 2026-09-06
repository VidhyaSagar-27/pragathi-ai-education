'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, FileText, ExternalLink, Download } from 'lucide-react';
import { StudyMaterial } from '@/lib/db/types';

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content/materials')
      .then((r) => r.json())
      .then((data) => {
        setMaterials(data.materials || []);
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Assigned Study Materials
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Download PDF notes, topic guides, and reference documents prepared for your modules.
        </p>
      </div>

      {materials.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                    Module 0{mat.moduleId}
                  </span>
                  <span className="text-xs text-slate-400">{mat.type}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{mat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{mat.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">By {mat.creatorName}</span>
                {mat.fileUrl ? (
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    <span>Open / Download</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Resource in class</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Study Materials Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Curriculum notes and PDFs will appear here once published by your instructor.
          </p>
        </div>
      )}
    </div>
  );
}
