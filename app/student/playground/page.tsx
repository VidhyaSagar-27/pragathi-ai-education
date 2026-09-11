import React from 'react';
import AiPlayground from '@/components/AiPlayground';
import { Sparkles, Terminal, Cpu } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student AI Playground | PRAGATHI AI',
};

export default function StudentPlaygroundPage() {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Curriculum Sandbox</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          AI Code & Concept Playground
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Apply concepts from Module 4 (Machine Learning), Module 5 (NLP & Generative AI), and Module 6 (Computer Vision) with live parameter tweaking.
        </p>
      </div>

      <AiPlayground />
    </div>
  );
}
