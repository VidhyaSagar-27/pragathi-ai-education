'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Layers,
  Compass,
  Cpu,
  Network,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Video,
  ExternalLink,
} from 'lucide-react';
import { ModuleItem, StudyMaterial, VideoItem } from '@/lib/db/types';

const moduleIconMap: Record<number, any> = {
  1: Brain,
  2: Layers,
  3: Compass,
  4: Cpu,
  5: Network,
  6: Sparkles,
  7: ShieldCheck,
};

export default function StudentModulesPage() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public-content').then((r) => r.json()),
      fetch('/api/content/materials').then((r) => r.json()),
      fetch('/api/content/videos').then((r) => r.json()),
    ])
      .then(([pub, mat, vid]) => {
        setModules(pub.modules || []);
        setMaterials(mat.materials || []);
        setVideos(vid.videos || []);
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

  const activeModule = modules.find((m) => m.number === selectedModuleId) || modules[0];
  const ActiveIcon = moduleIconMap[activeModule?.number || 1] || Brain;

  const moduleMaterials = materials.filter((m) => m.moduleId === activeModule?.number);
  const moduleVideos = videos.filter((v) => v.moduleId === activeModule?.number);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Foundation Modules & Syllabus
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore topics, assigned notes, and video tutorials across all 7 foundation curriculum modules.
        </p>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {modules.map((m) => (
          <button
            key={m.number}
            onClick={() => setSelectedModuleId(m.number)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              selectedModuleId === m.number
                ? 'bg-brand-navy text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Module 0{m.number}
          </button>
        ))}
      </div>

      {/* Active Module Details */}
      {activeModule && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
                <ActiveIcon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  Module 0{activeModule.number}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                  {activeModule.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{activeModule.description}</p>
              </div>
            </div>
          </div>

          {/* Topics & Learning Outcome */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Core Topics
              </h3>
              <ul className="space-y-2">
                {activeModule.topics.map((t, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-teal-50/50 border border-teal-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
                  Learning Outcome
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {activeModule.learningOutcome}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-teal-100/80 text-[11px] text-teal-700 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Standardized PRAGATHI AI Syllabus</span>
              </div>
            </div>
          </div>

          {/* Assigned Study Materials */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Assigned Study Materials</span>
            </h3>
            {moduleMaterials.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {moduleMaterials.map((mat) => (
                  <div key={mat.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition">
                    <h4 className="text-sm font-bold text-slate-900">{mat.title}</h4>
                    {mat.description && <p className="text-xs text-slate-500 mt-1">{mat.description}</p>}
                    {mat.fileUrl && (
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                      >
                        <span>Open Resource</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Study resources for Module 0{activeModule.number} will be published here by instructors.
              </div>
            )}
          </div>

          {/* Assigned Videos */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Video className="w-4 h-4 text-teal-600" />
              <span>Module Video Lessons</span>
            </h3>
            {moduleVideos.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {moduleVideos.map((vid) => (
                  <div key={vid.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <h4 className="text-sm font-bold text-slate-900">{vid.title}</h4>
                    {vid.description && <p className="text-xs text-slate-500 mt-1">{vid.description}</p>}
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      <span>Watch Lesson</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Video sessions for Module 0{activeModule.number} will appear once uploaded.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
