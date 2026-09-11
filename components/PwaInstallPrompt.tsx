'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Check if dismissed previously this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      setShowPrompt(true);
    }

    // Capture Chrome/Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 print:hidden animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-md">
          <Smartphone className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 text-xs">
          <h4 className="font-black text-sm text-white">Download PRAGATHI AI Mobile App</h4>
          {isIos ? (
            <p className="text-slate-300 mt-1 leading-relaxed">
              Install on your iPhone/iPad: tap <Share2 className="inline w-3.5 h-3.5 text-teal-400" /> Share, then scroll down and tap <PlusSquare className="inline w-3.5 h-3.5 text-teal-400" /> <strong>Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="text-slate-300 mt-1 leading-relaxed">
              Install our mobile application for instant access to syllabus, exams, and AI tutor without opening a browser!
            </p>
          )}

          <div className="mt-3 flex items-center space-x-2">
            {!isIos && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition shadow-xs flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-slate-400 hover:text-white font-semibold transition"
            >
              Maybe Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
