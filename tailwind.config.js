/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        /* flashcard bg uses custom .bg-flashcard in index.css for gradient support */
        card: 'var(--color-card-bg)',
        input: 'var(--color-input-bg)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',
        'border-default': 'var(--color-border)',
      },
      transitionDuration: {
        DEFAULT: '220ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      keyframes: {
        'landing-intro': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-enter': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'tab-drop-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.35)', transform: 'scale(1)' },
          '50%': { boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2)', transform: 'scale(1.02)' },
        },
        'tab-drag': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.98)', opacity: '0.7' },
        },
        'tab-enter': {
          '0%': { opacity: '0', transform: 'translateX(-8px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
      },
      animation: {
        'landing-intro': 'landing-intro 1s ease-out forwards',
        'fade-in': 'fade-in 0.25s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'toast-enter': 'toast-enter 0.28s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'tab-drop-pulse': 'tab-drop-pulse 0.8s ease-in-out infinite',
        'tab-drag': 'tab-drag 0.15s ease-out forwards',
        'tab-enter': 'tab-enter 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [],
}
