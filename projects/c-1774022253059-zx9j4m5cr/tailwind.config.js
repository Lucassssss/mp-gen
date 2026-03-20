/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: '#ff4757',
        secondary: '#2f3542',
        accent: '#ffa502',
        dark: '#1e1e1e',
        light: '#f5f5f5',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
