/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chat: {
          bg: '#0d0d0d',
          sidebar: '#171717',
          input: '#1e1e1e',
          hover: '#2a2a2a',
          border: '#333333',
          accent: '#7c3aed',
          'accent-light': '#a78bfa',
        },
      },
    },
  },
  plugins: [],
};
