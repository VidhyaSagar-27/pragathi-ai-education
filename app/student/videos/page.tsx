'use client';

import React, { useState, useEffect } from 'react';
import { Video, ExternalLink, Play } from 'lucide-react';
import { VideoItem } from '@/lib/db/types';

export default function StudentVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content/videos')
      .then((r) => r.json())
      .then((data) => {
        setVideos(data.videos || []);
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
          Video Lessons & Demonstrations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Visual walk-throughs, recorded seminars, and interactive AI coding sessions.
        </p>
      </div>

      {videos.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-subtle hover:shadow-card transition flex flex-col justify-between"
            >
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative group">
                <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition">
                  <Play className="w-5 h-5 ml-0.5 fill-white" />
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-white">
                  {vid.provider}
                </span>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    Module 0{vid.moduleId}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">{vid.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{vid.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">By {vid.creatorName}</span>
                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    <span>Watch Video</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Video Lessons Available</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            New video lessons and demonstrations will appear here once published by your instructors.
          </p>
        </div>
      )}
    </div>
  );
}
