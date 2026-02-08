/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* flashcard bg uses custom .bg-flashcard in index.css for gradient support */
        card: 'var(--color-card-bg)',
        input: 'var(--color-input-bg)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',
        'border-default': 'var(--color-border)',
      },
    },
  },
  plugins: [],
}
