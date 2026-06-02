/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a3a2a',
          light: '#2d5a40',
        },
        accent: {
          DEFAULT: '#c8f135',
          dark: '#a8d020',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '1rem',
      },
    },
  },
  plugins: [],
};
