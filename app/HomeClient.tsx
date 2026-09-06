'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
import WhyPragathiSection from '@/components/WhyPragathiSection';
import WhyLearnAISection from '@/components/WhyLearnAISection';
import LearningJourneySection from '@/components/LearningJourneySection';
import SyllabusSection from '@/components/SyllabusSection';
import ActivitiesSection from '@/components/ActivitiesSection';
import GallerySection from '@/components/GallerySection';
import AchievementsSection from '@/components/AchievementsSection';
import SchoolPartnershipSection from '@/components/SchoolPartnershipSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import RegistrationModal from '@/components/RegistrationModal';

interface HomeClientProps {
  initialData: {
    settings: any;
    modules: any[];
    activities: any[];
    gallery: any[];
    achievements: any[];
    testimonials: any[];
  };
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Sticky Header */}
      <Navbar onOpenRegister={() => setIsRegisterOpen(true)} />

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero
          onOpenRegister={() => setIsRegisterOpen(true)}
          settings={initialData.settings}
        />

        {/* About PRAGATHI AI, Mission & Vision, 5 Core Pillars */}
        <AboutSection settings={initialData.settings} />

        {/* Why PRAGATHI AI (8 Cards) */}
        <WhyPragathiSection />

        {/* Why Learn AI? (6 Cards) */}
        <WhyLearnAISection />

        {/* 5-Step Learning Journey */}
        <LearningJourneySection />

        {/* 7-Module Syllabus */}
        <SyllabusSection
          modules={initialData.modules}
          onOpenRegister={() => setIsRegisterOpen(true)}
        />

        {/* Activities Section */}
        <ActivitiesSection activities={initialData.activities} />

        {/* Gallery Section */}
        <GallerySection gallery={initialData.gallery} />

        {/* Achievements Section */}
        <AchievementsSection achievements={initialData.achievements} />

        {/* Bring PRAGATHI AI to Your School */}
        <SchoolPartnershipSection />

        {/* Contact Section */}
        <ContactSection settings={initialData.settings} />
      </main>

      {/* Footer */}
      <Footer settings={initialData.settings} />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
