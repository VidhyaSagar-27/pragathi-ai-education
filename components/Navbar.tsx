'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, UserCheck, ShieldCheck, GraduationCap, Sparkles, Search } from 'lucide-react';

interface NavbarProps {
  onOpenRegister?: () => void;
}

export default function Navbar({ onOpenRegister }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ role: string; name: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Check user session
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setSessionUser(data.user);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Curriculum', href: '/curriculum' },
    { label: 'AI Playground', href: '/playground' },
    { label: 'Activities', href: '/activities' },
    { label: 'Achievements', href: '/achievements' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'School Partnership', href: '/partnerships' },
    { label: 'Verify Credential', href: '/verify-certificate' },
    { label: 'Contact', href: '/contact' },
  ];

  const getDashboardLink = () => {
    if (!sessionUser) return '/login';
    if (sessionUser.role === 'ADMIN') return '/admin';
    if (sessionUser.role === 'INSTRUCTOR') return '/instructor';
    return '/student';
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'glass-nav border-b border-slate-200/80 shadow-sm py-2'
          : 'bg-white/95 border-b border-slate-100 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24 lg:h-24">
          
          {/* Official Logo with generous breathing space and prominent sizing */}
          <Link
            href="/"
            className="flex items-center space-x-3 group py-1 pl-1 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 select-none"
          >
            <div className="relative flex items-center justify-center p-1 bg-white rounded-xl shadow-xs">
              <img
                src="/images/logo.png"
                alt="PRAGATHI AI Logo"
                className="h-[58px] sm:h-[70px] lg:h-[82px] w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links with Live Active Location Pill */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href || (pathname?.startsWith(link.href) && link.href !== '/');

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200/90 shadow-xs'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100/70'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition"
              title="Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-teal-600" />
              <span>Search</span>
              <kbd className="text-[10px] bg-white border border-slate-300 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </button>

            {sessionUser ? (
              <Link
                href={getDashboardLink()}
                className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg border border-slate-200 transition-colors select-none"
              >
                {sessionUser.role === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-brand-purple" />}
                {sessionUser.role === 'INSTRUCTOR' && <GraduationCap className="w-4 h-4 text-teal-600" />}
                {sessionUser.role === 'STUDENT' && <UserCheck className="w-4 h-4 text-teal-600" />}
                <span>My Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-teal-700 px-3 py-2 rounded-md transition-colors select-none"
              >
                Portal Login
              </Link>
            )}

            <button
              onClick={() => {
                if (onOpenRegister) {
                  onOpenRegister();
                } else {
                  window.location.href = '/register';
                }
              }}
              className="inline-flex items-center justify-center space-x-2 text-sm font-medium text-white bg-gradient-to-r from-brand-navy to-brand-teal hover:from-slate-900 hover:to-teal-600 px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/40 select-none cursor-pointer"
            >
              <span>Join PRAGATHI AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-teal-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 select-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer with Live Active Location Pill */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1 divide-y divide-slate-100">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href || (pathname?.startsWith(link.href) && link.href !== '/');

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors select-none ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80'
                      : 'text-slate-700 hover:text-teal-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col space-y-2.5">
            {sessionUser ? (
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-center font-medium"
              >
                <span>Go to My Dashboard ({sessionUser.role})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 border border-slate-300 text-slate-700 hover:text-teal-700 hover:border-teal-500 rounded-lg text-center font-medium"
              >
                Portal Login
              </Link>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenRegister) {
                  onOpenRegister();
                } else {
                  window.location.href = '/register';
                }
              }}
              className="w-full py-2.5 px-4 text-white bg-gradient-to-r from-brand-navy to-brand-teal rounded-lg text-center font-medium shadow-sm cursor-pointer"
            >
              Join PRAGATHI AI
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
