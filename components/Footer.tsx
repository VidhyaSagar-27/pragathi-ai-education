'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, Instagram, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface FooterProps {
  settings?: {
    phonePrimary?: string;
    phoneSecondary?: string;
    email?: string;
    instagramHandle?: string;
    instagramUrl?: string;
  };
}

export default function Footer({ settings }: FooterProps) {
  const phone1 = settings?.phonePrimary || '+91 9618611522';
  const phone2 = settings?.phoneSecondary || '+91 6281738986';
  const email = settings?.email || 'hello.pragathiai@gmail.com';
  const instaHandle = settings?.instagramHandle || '@pragathi_ai';
  const instaUrl = settings?.instagramUrl || 'https://instagram.com/pragathi_ai';

  const quickLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'About', href: '#about' },
    { label: 'Program', href: '#program' },
    { label: 'Syllabus', href: '#syllabus' },
    { label: 'Activities', href: '#activities' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'School Partnership', href: '#partnership' },
    { label: 'Portal Login', href: '/login' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <footer className="bg-brand-navy text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block p-2 bg-white rounded-2xl shadow-sm hover:opacity-95 transition">
              <img
                src="/images/logo.png"
                alt="PRAGATHI AI Logo"
                className="h-[80px] sm:h-[95px] w-auto object-contain"
              />
            </Link>

            <h3 className="text-xl font-extrabold text-white tracking-tight">
              PRAGATHI AI
            </h3>
            <p className="text-teal-300 text-sm font-medium">
              Empowering Students for the AI-Powered Future
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An Artificial Intelligence education initiative introducing school students to AI, computational reasoning, practical problem-solving, and future-ready capabilities.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-teal-400 transition-colors inline-flex items-center"
                  >
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Contact
            </h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <a
                    href={`tel:${phone1.replace(/\s+/g, '')}`}
                    className="block hover:text-white transition-colors"
                  >
                    {phone1}
                  </a>
                  <a
                    href={`tel:${phone2.replace(/\s+/g, '')}`}
                    className="block hover:text-white transition-colors"
                  >
                    {phone2}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 pt-1">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-white transition-colors"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>

          {/* Social Media Column */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Follow PRAGATHI AI
            </h4>
            <a
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
            >
              <Instagram className="w-4 h-4 text-teal-300" />
              <span>Instagram: {instaHandle}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-teal-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin & Staff Access</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-center sm:flex sm:justify-between sm:items-center text-xs text-slate-400">
          <p>© 2026 PRAGATHI AI. All Rights Reserved.</p>
          <p className="mt-2 sm:mt-0">
            Pragathi AI Foundation Program • Artificial Intelligence Education Initiative
          </p>
        </div>
      </div>
    </footer>
  );
}
