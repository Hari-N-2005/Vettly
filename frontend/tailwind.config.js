/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'legal-dark': '#0f172a',
        'legal-slate': '#1e293b',
        'legal-blue': '#1e40af',
        'legal-accent': '#3b82f6',
        'legal-gold': '#d4a574',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
