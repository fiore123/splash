/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- Importante: ativa o controle manual do modo escuro
  theme: {
    extend: {},
  },
  plugins: [],
}