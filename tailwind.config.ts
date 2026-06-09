import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B5BDB',
          dark: '#1a40c2',
          light: '#b8c3ff',
          foreground: '#ffffff',
        },
        secondary: { DEFAULT: '#4855b7', foreground: '#ffffff' },
        sidebar: '#1E2B8F',
        background: '#F0F2FF',
        surface: '#ffffff',
        border: '#E5E7EB',
        success: { DEFAULT: '#12B76A', bg: 'rgba(18,183,106,0.12)', text: '#027A48' },
        warning: { DEFAULT: '#F59E0B', bg: 'rgba(245,158,11,0.12)', text: '#B45309' },
        danger: { DEFAULT: '#EF4444', bg: 'rgba(239,68,68,0.12)', text: '#B91C1C' },
      },
      fontFamily: { sans: ['var(--font-inter)', 'Inter', 'sans-serif'] },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: { sidebar: '260px' },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        modal: '0 12px 24px rgba(26,26,46,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10)',
      },
      maxWidth: { container: '1200px' },
    },
  },
  plugins: [],
}

export default config
