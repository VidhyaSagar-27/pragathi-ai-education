'use client';

import React, { useState } from 'react';
import {
  Brain,
  Layers,
  Compass,
  Cpu,
  Network,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { ModuleItem } from '@/lib/db/types';

interface SyllabusProps {
  modules?: ModuleItem[];
  onOpenRegister?: () => void;
}

const moduleIconMap: Record<number, any> = {
  1: Brain,
  2: Layers,
  3: Compass,
  4: Cpu,
  5: Network,
  6: Sparkles,
  7: ShieldCheck,
};

export default function SyllabusSection({ modules, onOpenRegister }: SyllabusProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);

  // Fallback to official 7 handwritten modules
  const defaultModules = [
    {
      id: 1,
      number: 1,
      title: 'Introduction to AI',
      topics: [
        'What is Artificial Intelligence?',
        'History of AI',
        'Types of AI',
        'AI around us',
        'Intelligent Agents',
      ],
      learningOutcome:
        'Students will grasp foundational concepts, history, modern manifestations, and intelligent agent structures in AI.',
    },
    {
      id: 2,
      number: 2,
      title: 'How AI Thinks',
      topics: [
        'Problem Solving in AI',
        'Search Strategies',
        'Heuristics',
        'Decision Trees',
      ],
      learningOutcome:
        'Students will understand algorithmic thinking, state-space problem formulation, heuristic search, and decision trees.',
    },
    {
      id: 3,
      number: 3,
      title: 'Logic & Reasoning',
      topics: [
        'If-Then Rules',
        'Knowledge Representation',
        'Logical Reasoning',
        'Rule-Based Systems',
        'Expert Systems',
      ],
      learningOutcome:
        'Students will master propositional logic, knowledge graphs, inference chaining, and rule-based expert systems.',
    },
    {
      id: 4,
      number: 4,
      title: 'Machine Learning',
      topics: [
        'What is Machine Learning?',
        'Supervised Learning',
        'Unsupervised Learning',
        'Reinforcement Learning',
        'Neural Networks',
        'Deep Learning',
      ],
      learningOutcome:
        'Students will master core machine learning paradigms, neural network computation, and deep hierarchical representation learning.',
    },
    {
      id: 5,
      number: 5,
      title: 'NLP & Generative AI',
      topics: [
        'What is NLP?',
        'Conversational AI Tools',
        'Prompting - Talking to AI Efficiently',
        'Translation & Text Generation',
        'AI Image, Video & Music Generation',
      ],
      learningOutcome:
        'Students will understand natural language processing, efficient prompt engineering, conversational AI agents, and creative multimodal media synthesis.',
    },
    {
      id: 6,
      number: 6,
      title: 'Computer Vision & Robotics',
      topics: [
        'What is Computer Vision?',
        'Object and Face Recognition',
        'Robotics Fundamentals',
        'How AI and Robotics work together?',
      ],
      learningOutcome:
        'Students will understand visual perception in machines, facial and object detection algorithms, robotic kinematics, and physical AI integration.',
    },
    {
      id: 7,
      number: 7,
      title: 'AI Ethics, Careers & the Future',
      topics: [
        'AI Ethics - Fairness and Bias',
        'Deepfakes and Misinformation',
        'Responsible AI & Cyber Safety',
        'Careers in AI',
        'The Future of AI',
      ],
      learningOutcome:
        'Students will evaluate ethical implications of AI, combat deepfakes and algorithmic bias, practice cyber safety, and explore emerging AI careers.',
    },
  ];

  const displayModules = modules && modules.length > 0 ? modules : defaultModules;
  const activeModule = displayModules.find((m) => m.number === selectedModuleId) || displayModules[0];
  const ActiveIcon = moduleIconMap[activeModule.number] || Brain;

  return (
    <section id="syllabus" className="py-20 lg:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-100 select-none cursor-default">
            Comprehensive Curriculum
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            The PRAGATHI AI Learning Journey
          </h2>
          <p className="text-lg text-slate-600 mt-3 leading-relaxed">
            Seven meticulously organized modules engineered specifically for school students to establish deep, lasting computational comprehension.
          </p>
        </div>

        {/* 7 Modules Grid View */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayModules.map((mod) => {
            const ModIcon = moduleIconMap[mod.number] || Brain;
            const isSelected = mod.number === selectedModuleId;
            return (
              <div
                key={mod.number}
                onClick={() => setSelectedModuleId(mod.number)}
                className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-teal-50/50 to-white border-teal-500 shadow-card ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200/90 shadow-subtle hover:border-slate-300 hover:shadow-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 tracking-wider">
                      MODULE 0{mod.number}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <ModIcon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2">
                    {mod.title}
                  </h3>

                  {/* Main Topics */}
                  <div className="space-y-1.5 mb-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Topics</p>
                    <ul className="space-y-1 text-xs sm:text-sm text-slate-600">
                      {mod.topics.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-start space-x-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Learning Outcome */}
                <div className="pt-4 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl">
                  <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">Learning Outcome</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {mod.learningOutcome}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Syllabus Footer Callout */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-navy via-slate-900 to-teal-900 text-white p-8 sm:p-10 shadow-elevated flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Pragathi AI Foundation Program
            </span>
            <h3 className="text-2xl font-bold mt-1">Ready to Master the 7 Modules?</h3>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Equip your students with hands-on exercises, guided assignments, and official certification.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-sm shadow-md transition-colors text-center"
            >
              Enroll Student Today
            </button>
            <a
              href="#partnership"
              className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-colors text-center"
            >
              School Partnership
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
