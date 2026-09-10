/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        dark: {
          100: '#1a1a2e',
          200: '#16213e',
          300: '#0f0f1a',
        },
      },
    },
  },
  plugins: [],
};
