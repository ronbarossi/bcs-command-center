/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bcs-navy': '#2B3E50',
        'bcs-dark-navy': '#1a2633',
        'bcs-coral': '#FF6B6B',
        'bcs-orange': '#FFA94D',
        'bcs-cyan': '#4ECDC4',
      }
    },
  },
  plugins: [],
}
