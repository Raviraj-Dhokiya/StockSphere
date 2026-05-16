/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#080c14',
          800: '#0d1421',
          700: '#111827',
          600: '#1a2235',
          500: '#1e2a3a',
          400: '#243044',
        },
        accent: {
          green: '#00d4aa',
          'green-dim': '#00d4aa33',
          red: '#ff4d6d',
          'red-dim': '#ff4d6d33',
          blue: '#3b82f6',
          'blue-dim': '#3b82f620',
          yellow: '#f59e0b',
          purple: '#8b5cf6',
        },
        surface: {
          DEFAULT: '#1a2235',
          hover: '#1e2a3a',
          border: '#2a3548',
        },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232a3548' fill-opacity='0.4'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        shimmer: 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideRight: { from: { transform: 'translateX(-20px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        glow: '0 0 20px rgba(0,212,170,0.15)',
        'glow-red': '0 0 20px rgba(255,77,109,0.15)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
