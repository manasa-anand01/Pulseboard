import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f6f5f1',
          100: '#e8e6dc',
          200: '#c9c5b3',
          300: '#9a9479',
          400: '#6b6750',
          500: '#3a3727',
          600: '#26241a',
          700: '#1a1812',
          800: '#12110b',
          900: '#0a0906',
        },
        ember: {
          DEFAULT: '#e8643c',
          soft: '#f4a07f',
          deep: '#a8412a',
        },
        sage: {
          DEFAULT: '#8da57e',
          soft: '#b8c9ac',
          deep: '#5a6e4f',
        },
        signal: {
          urgent: '#d94545',
          warn: '#e8a93c',
          calm: '#7da89e',
        },
      },
      animation: {
        'fade-up': 'fadeUp 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 400ms ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
