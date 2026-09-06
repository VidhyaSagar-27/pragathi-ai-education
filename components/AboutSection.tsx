'use client';

import React from 'react';
import { Target, Eye, Brain, Puzzle, Lightbulb, Binary, Rocket } from 'lucide-react';

interface AboutSectionProps {
  settings?: {
    aboutOverview?: string;
    missionStatement?: string;
    visionStatement?: string;
  };
}

export default function AboutSection({ settings }: AboutSectionProps) {
  const aboutText =
    settings?.aboutOverview ||
    'PRAGATHI AI is an Artificial Intelligence education initiative designed to introduce students to Artificial Intelligence in a simple, practical, engaging, and understandable way.';

  const missionText =
    settings?.missionStatement ||
    'To make Artificial Intelligence education accessible, engaging, practical, and understandable for students.';

  const visionText =
    settings?.visionStatement ||
    'To prepare students for an AI-powered future by developing curiosity, creativity, technological awareness, and problem-solving skills.';

  const focusAreas = [
    {
      title: 'AI Awareness',
      description: 'Demystifying how smart systems interpret signals, recognize patterns, and make informed predictions.',
      icon: Brain,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      title: 'Problem-Solving Skills',
      description: 'Cultivating systematic algorithmic thinking, search techniques, and analytical logic to solve challenges.',
      icon: Puzzle,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Creativity',
      description: 'Empowering students to co-create with modern generative tools, prompt engineering, and digital ideation.',
      icon: Lightbulb,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Technology Understanding',
      description: 'Gaining foundational clarity on algorithms, neural architectures, data training, and software systems.',
      icon: Binary,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
    },
    {
      title: 'Future-Ready Skills',
      description: 'Preparing young minds for emerging academic disciplines, technological literacy, and future global careers.',
      icon: Rocket,
      color: 'text-brand-purple bg-purple-50 border-purple-100',
    },
  ];

  return (
    <section id="about" className="py-20 lg:py-28 bg-white border-b border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-100 select-none cursor-default">
            About PRAGATHI AI
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Nurturing Tomorrow’s Innovators in Artificial Intelligence
          </h2>
          <p className="text-lg text-slate-600 mt-4 leading-relaxed">
            {aboutText}
          </p>
        </div>

        {/* Mission and Vision Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Mission Card */}
          <div className="relative overflow-hidden p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-teal-50/40 border border-slate-200/80 shadow-card hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center space-x-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Our Purpose</span>
                <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
              </div>
            </div>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
              {missionText}
            </p>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center text-sm font-medium text-teal-800">
              <span>Accessible • Engaging • Practical • Understandable</span>
            </div>
          </div>

          {/* Vision Card */}
          <div className="relative overflow-hidden p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-slate-200/80 shadow-card hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center space-x-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center text-white shadow-md">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Our Direction</span>
                <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
              </div>
            </div>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
              {visionText}
            </p>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center text-sm font-medium text-slate-800">
              <span>Curiosity • Creativity • Awareness • Problem-Solving</span>
            </div>
          </div>
        </div>

        {/* 5 Core Pillars */}
        <div>
          <div className="text-center mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Five Pillars of the PRAGATHI AI Learning Experience
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Designed specifically for school students to construct lasting foundational competencies
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {focusAreas.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
