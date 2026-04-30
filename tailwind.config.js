/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        peach: {
          50: '#fff7ef',
          100: '#ffeedb',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        cream: '#fef9f0',
        sand: '#f5e9d4',
        dusk: '#fcd9b6',
        skyish: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          500: '#38bdf8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Quicksand', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 30px -12px rgba(251, 146, 60, 0.22)',
        card: '0 14px 30px -14px rgba(124, 100, 80, 0.18)',
        glow: '0 0 0 6px rgba(253, 186, 116, 0.25)',
      },
      borderRadius: {
        blob: '32px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-soft': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.4)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.06)' },
        },
        'drift-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-in-soft': 'fade-in-soft 0.8s ease-out both',
        float: 'float 4.2s ease-in-out infinite',
        sparkle: 'sparkle 2.6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.8s ease-in-out infinite',
        'drift-x': 'drift-x 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
