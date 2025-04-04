/** @type {import('@tailwindcss/postcss7-compat').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  purge: false,
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 