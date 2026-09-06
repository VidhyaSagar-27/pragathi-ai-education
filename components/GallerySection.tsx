'use client';

import React, { useState } from 'react';
import { GalleryItem } from '@/lib/db/types';
import { Image as ImageIcon, Video, Camera, ExternalLink } from 'lucide-react';

interface GalleryProps {
  gallery?: GalleryItem[];
}

const CATEGORIES = ['All', 'Classroom', 'Student Activities', 'Events', 'Sessions'];

export default function GallerySection({ gallery = [] }: GalleryProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = gallery.filter((item) => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  return (
    <section id="gallery" className="py-20 lg:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-100 select-none cursor-default">
            In Action
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            PRAGATHI AI Gallery
          </h2>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            A glimpse into actual classroom workshops, student demonstrations, and hands-on AI learning sessions.
          </p>
        </div>

        {/* Category Pills if there are items */}
        {gallery.length > 0 && (
          <div className="flex items-center justify-center space-x-2 mb-10 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-subtle hover:shadow-card transition-all"
              >
                {item.mediaType === 'VIDEO' ? (
                  <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                    <Video className="w-12 h-12 text-white/70" />
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors"
                    >
                      <span className="text-xs font-semibold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                        <span>Watch Video</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  </div>
                ) : (
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4 bg-white">
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{item.title}</h4>
                  {item.caption && (
                    <p className="text-xs text-slate-500 mt-1">{item.caption}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Official Empty State strictly matching specifications */
          <div className="bg-slate-50 rounded-2xl p-12 text-center max-w-2xl mx-auto border border-dashed border-slate-300 shadow-subtle">
            <div className="w-16 h-16 rounded-2xl bg-white text-teal-700 mx-auto flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              PRAGATHI AI Moments Coming Soon
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Real learning experiences and activities will be showcased here.
            </p>
            <p className="text-xs text-slate-400 mt-4">
              All visual records are verified and published directly by PRAGATHI AI administrators.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
