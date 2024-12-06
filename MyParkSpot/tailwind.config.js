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
    },
  },
  plugins: [],
};
