import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pragathiai.com'),
  title: 'PRAGATHI AI | Empowering Students for the AI-Powered Future',
  description:
    'PRAGATHI AI is an Artificial Intelligence education initiative introducing school students to AI, machine learning, problem-solving, creativity, and future-ready skills.',
  keywords: [
    'Artificial Intelligence Education',
    'AI Education for Students',
    'AI Foundation Program',
    'Future-Ready Skills',
    'Technology Education',
    'Pragathi AI',
    'School AI Curriculum',
  ],
  authors: [{ name: 'PRAGATHI AI' }],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'PRAGATHI AI | Empowering Students for the AI-Powered Future',
    description:
      'PRAGATHI AI Foundation Program: Empowering school students with artificial intelligence, machine learning, and future-ready skills.',
    url: 'https://pragathiai.com',
    siteName: 'PRAGATHI AI',
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 800,
        alt: 'PRAGATHI AI Official Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
