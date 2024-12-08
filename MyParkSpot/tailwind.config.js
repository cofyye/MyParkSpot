/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ejs}'],
  theme: {
    extend: {
      colors: {
        primary: '#01010d',
        secondary: '#606060',
        light: '#f3f3f3',
        background: '#ffffff',
        hover: '#2e2e2e',
        accent1: '#829aaa',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      boxShadow: {
        custom:
          '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};
