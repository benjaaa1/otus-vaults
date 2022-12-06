/* eslint-disable  @typescript-eslint/no-var-requires */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontSize: {
        xxs: ['0.625rem', '0.75rem']
      },
    },
    fontFamily: {
      sans: ['"Rubik"', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'serif'],
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp')
  ],
}