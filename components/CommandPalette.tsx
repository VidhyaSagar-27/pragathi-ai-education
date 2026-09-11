'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  FileQuestion,
  Sparkles,
  Award,
  Video,
  ClipboardList,
  User,
  ShieldCheck,
  X,
  ArrowRight,
} from 'lucide-react';

interface PaletteItem {
  title: string;
  category: string;
  href: string;
  icon: any;
  keywords: string;
}

const COMMAND_ITEMS: PaletteItem[] = [
  // Modules
  { title: 'Module 1: Introduction to AI', category: 'Syllabus', href: '/#syllabus', icon: BookOpen, keywords: 'intro basics history agents types' },
  { title: 'Module 2: How AI Thinks', category: 'Syllabus', href: '/#syllabus', icon: BookOpen, keywords: 'problem solving search heuristics decision trees' },
  { title: 'Module 3: Logic & Reasoning', category: 'Syllabus', href: '/#syllabus', icon: BookOpen, keywords: 'if-then rules knowledge representation inference expert systems' },
  { title: 'Module 4: Machine Learning', category: 'Syllabus', href: '/#syllabus', icon: BookOpen, keywords: 'supervised unsupervised reinforcement neural networks deep learning' },
  { title: 'Module 5: NLP & Generative AI', category: 'Syllabus', href: '/#syllabus', icon: BookOpen, keywords: 'nlp chatgpt prompting llm generative image diffusion' },
  { title: 'Module 6: Computer Vision & Robotics', category: 'Syllabus', href: '/#syllabus', icon: BookOpen, keywords: 'vision camera object detection face recognition robotics' },
  { title: 'Module 7: AI Ethics, Careers & Future', category: 'Syllabus', href: '/#syllabus', icon: BookOpen, keywords: 'ethics bias deepfakes cyber safety careers future agi' },

  // Interactive Tools
  { title: 'Interactive AI Playground & Sandbox', category: 'Labs', href: '/playground', icon: Sparkles, keywords: 'neural network prompt lab convolutions simulator' },
  { title: 'Verify Certificate of Achievement', category: 'Credentials', href: '/verify-certificate', icon: ShieldCheck, keywords: 'verify credential diploma search authenticity' },

  // Portals
  { title: 'Student Assessments & Quizzes', category: 'Portal', href: '/student/quizzes', icon: FileQuestion, keywords: 'exam test quiz scorecard' },
  { title: 'Student Assignments & Projects', category: 'Portal', href: '/student/assignments', icon: ClipboardList, keywords: 'homework practical code submission' },
  { title: 'Student Study Materials', category: 'Portal', href: '/student/materials', icon: BookOpen, keywords: 'notes pdf reading curriculum' },
  { title: 'Video Lessons', category: 'Portal', href: '/student/videos', icon: Video, keywords: 'tutorials lecture recordings' },
  { title: 'Student Profile & Photo', category: 'Account', href: '/student/profile', icon: User, keywords: 'avatar photo password settings' },
  { title: 'Admin Control Center', category: 'Administrative', href: '/admin', icon: ShieldCheck, keywords: 'admin dashboard curriculum reports cms' },
];

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = COMMAND_ITEMS.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );
  });

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, module title, or feature..."
            className="flex-1 text-sm bg-transparent focus:outline-hidden text-slate-800"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1 text-xs">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No matching pages or features found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item.href)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-teal-50 cursor-pointer transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center text-slate-600 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-teal-950">{item.title}</p>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.category}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition" />
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono">Ctrl+K</kbd> anywhere to search</span>
          <span>PRAGATHI AI Navigation</span>
        </div>
      </div>
    </div>
  );
}
