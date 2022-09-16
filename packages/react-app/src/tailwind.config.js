/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    fontFamily: {
      sans: ['"IBM Plex Sans"', 'sans-serif'],
      serif: ['"IBM Plex Mono"', 'serif'],
    },
    colors: {
      'black': '#1c1c1c',
      'white': '#ffffff',
      'gray': '#959595',
      'dark-gray': '#343434',
      'green': '#84FFC4'
    },
  },
  plugins: [],
};