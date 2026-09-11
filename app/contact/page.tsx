import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import { getDb, getFallbackPublicData } from '@/lib/db';
import { Phone, Mail, MapPin, Instagram, Sparkles, Clock, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const db = await getDb();
  const settings = db.settings || getFallbackPublicData().settings;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Page Hero */}
        <section className="bg-gradient-to-br from-brand-navy via-slate-900 to-teal-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4">
              <MessageSquare className="w-4 h-4" />
              <span>Direct Communication & Support</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
              Contact PRAGATHI AI
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Have questions about admissions, school partnerships, student credentials, or curriculum details? Our academic team is here to help.
            </p>
          </div>
        </section>

        {/* Quick Contact Cards */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Call Us Directly</h3>
              <p className="text-xs text-slate-500">Mon–Sat, 9am to 6pm IST</p>
              <a href={`tel:${settings.phonePrimary || '+919618611522'}`} className="block text-xs font-bold text-teal-700 hover:underline pt-1">
                {settings.phonePrimary || '+91 9618611522'}
              </a>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Email Support</h3>
              <p className="text-xs text-slate-500">24-hour response turnaround</p>
              <a href={`mailto:${settings.email || 'support@pragathiai.com'}`} className="block text-xs font-bold text-indigo-700 hover:underline pt-1 truncate">
                {settings.email || 'support@pragathiai.com'}
              </a>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">WhatsApp Helpdesk</h3>
              <p className="text-xs text-slate-500">Automated updates & alerts</p>
              <a
                href={`https://wa.me/91${(settings.phonePrimary || '9618611522').replace(/\D/g, '').slice(-10)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs font-bold text-emerald-700 hover:underline pt-1"
              >
                Chat on WhatsApp →
              </a>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center font-bold">
                <Instagram className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Social Community</h3>
              <p className="text-xs text-slate-500">Follow workshops & alerts</p>
              <a
                href={settings.instagramUrl || 'https://instagram.com/pragathiai_official'}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs font-bold text-pink-700 hover:underline pt-1"
              >
                {settings.instagramHandle || '@pragathiai_official'}
              </a>
            </div>
          </div>
        </section>

        {/* Contact Form Component */}
        <div className="py-4">
          <ContactSection settings={settings} />
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
