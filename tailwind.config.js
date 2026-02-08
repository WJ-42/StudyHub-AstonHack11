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
      },
      animation: {
        'fade-in': 'fade-in 0.25s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'toast-enter': 'toast-enter 0.28s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
      },
    },
  },
  plugins: [],
}
