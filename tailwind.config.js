/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}", // Jika Anda pakai folder app
  ],
  theme: {
    extend: {
      colors: {
        mgm: {
          red: '#dc2626',
          dark: '#1f2937',
        },
      },
    },
  },
  plugins: [],
}