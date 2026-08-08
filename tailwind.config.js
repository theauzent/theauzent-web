/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        auzentBg: '#F8FAFC',
        auzentSurface: '#FFFFFF',
        auzentMidnight: '#0F172A',
        auzentSubtext: '#475569',
        auzentBlue: '#2563EB',
        auzentSky: '#38BDF8',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}