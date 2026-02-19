import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cw-bg-0':      'var(--cw-bg-0)',
        'cw-bg-1':      'var(--cw-bg-1)',
        'cw-bg-2':      'var(--cw-bg-2)',
        'cw-bg-3':      'var(--cw-bg-3)',
        'cw-border':    'var(--cw-border)',
        'cw-accent':    'var(--cw-accent)',
        'cw-accent-hi': 'var(--cw-accent-hi)',
        'cw-text-0':    'var(--cw-text-0)',
        'cw-text-1':    'var(--cw-text-1)',
        'cw-text-2':    'var(--cw-text-2)',
        'cw-green':     'var(--cw-green)',
        'cw-orange':    'var(--cw-orange)',
        'cw-red':       'var(--cw-red)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
