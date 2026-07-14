/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          50: '#1E293B',
          100: '#334155',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#F3E5AB',
          100: '#C5A028',
        },
        success: {
          DEFAULT: '#1B7A40',
          50: '#22C55E',
        },
      },
    },
  },
  plugins: [],
}
