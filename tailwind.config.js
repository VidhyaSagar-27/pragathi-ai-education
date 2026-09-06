/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            DEFAULT: '#0F1E36',
            dark: '#071324',
            light: '#1A3358',
            subtle: '#244575',
          },
          teal: {
            DEFAULT: '#0D9488',
            dark: '#0F766E',
            light: '#14B8A6',
            hover: '#00A896',
            subtle: '#CCFBF1',
          },
          purple: {
            DEFAULT: '#6366F1',
            dark: '#4F46E5',
            light: '#818CF8',
            subtle: '#EEF2FF',
          },
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(15, 30, 54, 0.04), 0 1px 3px rgba(15, 30, 54, 0.06)',
        'card': '0 4px 20px -2px rgba(15, 30, 54, 0.06), 0 2px 6px -1px rgba(15, 30, 54, 0.04)',
        'elevated': '0 12px 30px -4px rgba(15, 30, 54, 0.1), 0 4px 12px -2px rgba(15, 30, 54, 0.05)',
        'glow-teal': '0 0 25px -3px rgba(13, 148, 136, 0.25)',
        'glow-purple': '0 0 25px -3px rgba(99, 102, 241, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'subtle-pattern': 'radial-gradient(#0D9488 0.75px, transparent 0.75px), radial-gradient(#6366F1 0.75px, #ffffff 0.75px)',
      },
    },
  },
  plugins: [],
};
