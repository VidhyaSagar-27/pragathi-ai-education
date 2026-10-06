'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'te' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    te: string;
    hi: string;
  };
}

export const DICTIONARY: Translations = {
  // Navigation & General
  'nav.dashboard': { en: 'Dashboard', te: 'డాష్‌బోర్డ్', hi: 'डैशबोर्ड' },
  'nav.students': { en: 'Manage Students', te: 'విద్యార్థుల నిర్వహణ', hi: 'छात्र प्रबंधन' },
  'nav.attendance': { en: 'Attendance System', te: 'హాజరు వ్యవస్థ', hi: 'उपस्थिति प्रणाली' },
  'nav.fees': { en: 'Fees & Payments', te: 'ఫీజులు & చెల్లింపులు', hi: 'फीस और भुगतान' },
  'nav.curriculum': { en: 'Curriculum & Syllabus', te: 'పాఠ్యాంశాలు', hi: 'पाठ्यक्रम' },
  'nav.quizzes': { en: 'Quizzes & Tests', te: 'క్విజ్‌లు & పరీక్షలు', hi: 'क्विज़ और परीक्षाएं' },
  'nav.playground': { en: 'AI Playground', te: 'AI ప్రయోగశాల', hi: 'एआई प्रयोगशाला' },
  'nav.certificates': { en: 'Certificates', te: 'ధృవీకరణ పత్రాలు', hi: 'प्रमाण पत्र' },
  'nav.instructors': { en: 'Manage Instructors', te: 'బోధకుల నిర్వహణ', hi: 'प्रशिक्षक प्रबंधन' },
  'nav.settings': { en: 'Settings', te: 'సెట్టింగ్‌లు', hi: 'सेटिंग्स' },

  // Attendance
  'att.present': { en: 'Present', te: 'హాజరు', hi: 'उपस्थित' },
  'att.absent': { en: 'Absent', te: 'గైర్హాజరు', hi: 'अनुपस्थित' },
  'att.mark_all_present': { en: 'Mark All Present', te: 'అందరినీ హాజరుగా గుర్తించు', hi: 'सभी को उपस्थित चिह्नित करें' },
  'att.mark_all_absent': { en: 'Mark All Absent', te: 'అందరినీ గైర్హాజరుగా గుర్తించు', hi: 'सभी को अनुपस्थित चिह्नित करें' },
  'att.save': { en: 'Save Attendance', te: 'హాజరును భద్రపరుచు', hi: 'उपस्थिति सहेजें' },
  'att.class_date': { en: 'Class Date', te: 'తరగతి తేదీ', hi: 'कक्षा की तारीख' },
  'att.attendance_rate': { en: 'Attendance Rate', te: 'హాజరు శాతం', hi: 'उपस्थिति दर' },
  'att.low_attendance': { en: 'Low Attendance', te: 'తక్కువ హాజరు', hi: 'कम उपस्थिति' },

  // Fees
  'fee.total_fee': { en: 'Total Fee', te: 'మొత్తం ఫీజు', hi: 'कुल शुल्क' },
  'fee.paid': { en: 'Paid', te: 'చెల్లించినది', hi: 'भुगतान किया' },
  'fee.pending': { en: 'Pending', te: 'బాకీ', hi: 'बकाया' },
  'fee.record_payment': { en: 'Record Payment', te: 'చెల్లింపును నమోదు చేయండి', hi: 'भुगतान दर्ज करें' },
  'fee.status_paid': { en: 'PAID', te: 'చెల్లించబడింది', hi: 'पूर्ण भुगतान' },
  'fee.status_partial': { en: 'PARTIALLY PAID', te: 'పాక్షిక చెల్లింపు', hi: 'आंशिक भुगतान' },
  'fee.status_pending': { en: 'PENDING', te: 'పెండింగ్', hi: 'लंबित' },

  // Common UI
  'ui.search': { en: 'Search by Roll No, Name...', te: 'రోల్ నెం లేదా పేరుతో వెతకండి...', hi: 'रोल नंबर या नाम से खोजें...' },
  'ui.loading': { en: 'Loading...', te: 'లోడ్ అవుతోంది...', hi: 'लोड हो रहा है...' },
  'ui.actions': { en: 'Actions', te: 'చర్యలు', hi: 'कार्रवाई' },
  'ui.student_name': { en: 'Student Name', te: 'విద్యార్థి పేరు', hi: 'छात्र का नाम' },
  'ui.roll_number': { en: 'Roll Number', te: 'రోల్ నంబర్', hi: 'रोल नंबर' },
  'ui.school': { en: 'School', te: 'పాఠశాల', hi: 'विद्यालय' },
  'ui.class': { en: 'Class / Grade', te: 'తరగతి', hi: 'कक्षा' },
  'ui.parent': { en: 'Parent / Guardian', te: 'తల్లిదండ్రులు', hi: 'अभिभावक' },
  'ui.phone': { en: 'Phone Number', te: 'ఫోన్ నంబర్', hi: 'फ़ोन नंबर' },
  'ui.download': { en: 'Download', te: 'డౌన్‌లోడ్', hi: 'डाउनलोड' },
  'ui.close': { en: 'Close', te: 'మూసివేయి', hi: 'बंद करें' },
  'ui.help_assistant': { en: 'Ask Pragathi AI', te: 'ప్రగతి AI ని అడగండి', hi: 'प्रगति AI से पूछें' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pragathi_lang') as Language;
      if (saved && (saved === 'en' || saved === 'te' || saved === 'hi')) {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('pragathi_lang', lang);
    } catch {}
  };

  const t = (key: string, fallback?: string): string => {
    const entry = DICTIONARY[key];
    if (!entry) return fallback || key;
    return entry[language] || entry.en || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitcherDropdown({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useI18n();

  return (
    <div className={`inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-lg transition ${
          language === 'en'
            ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('te')}
        className={`px-2.5 py-1 rounded-lg transition ${
          language === 'te'
            ? 'bg-teal-600 text-white shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-teal-700'
        }`}
        title="తెలుగు (Telugu)"
      >
        తెలుగు
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2.5 py-1 rounded-lg transition ${
          language === 'hi'
            ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-indigo-700'
        }`}
        title="हिंदी (Hindi)"
      >
        हिंदी
      </button>
    </div>
  );
}
