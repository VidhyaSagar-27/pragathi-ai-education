import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AiPlayground from '@/components/AiPlayground';
import { Sparkles, Terminal, Cpu } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive AI Playground | PRAGATHI AI',
  description: 'Hands-on interactive AI sandbox: simulate neural networks, experiment with prompt engineering, and test computer vision matrix convolutions.',
};

export default function PlaygroundPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-8">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Experiential Learning</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            PRAGATHI AI Interactive Playground & Sandbox
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Bridge theory and practice. Experiment with live neural network forward-pass activations, test prompt sampling temperatures, and explore computer vision kernel filtering in an intuitive, interactive environment.
          </p>
        </div>

        <AiPlayground />
      </main>

      <Footer />
    </div>
  );
}
