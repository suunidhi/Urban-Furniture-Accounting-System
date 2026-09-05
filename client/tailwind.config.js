/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        odoo: {
          primary: '#714B67', // Odoo purple
          primaryHover: '#5B3C53',
          secondary: '#017E84', // Odoo teal
          secondaryHover: '#006B70',
          bg: '#F9F9F9',
          text: '#212529',
          border: '#DEE2E6',
          sidebar: '#FFFFFF',
          sidebarHover: '#F4F4F4'
        }
      }
    },
  },
  plugins: [],
}
