import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft, LogIn, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-white p-1">
              <Image
                src="/images/logo.png"
                alt="PRAGATHI AI Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-navy-900 block leading-none">
                PRAGATHI <span className="text-teal-600">AI</span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase block mt-1">
                Learning Portal
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Portal Login
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 mx-auto flex items-center justify-center mb-6 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
            Error 404
          </span>

          <h1 className="text-3xl font-extrabold text-navy-900 mt-4 mb-2 tracking-tight">
            Page Not Found
          </h1>

          <p className="text-slate-600 text-sm mb-8 leading-relaxed">
            The page you requested could not be found. It may have been moved, renamed, or is temporarily unavailable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Login
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-500 bg-white">
        © 2026 PRAGATHI AI. All Rights Reserved.
      </footer>
    </div>
  );
}
