/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#714B67",
        secondary: "#017E84",
        gray: {
          DEFAULT: "#8F8F8F",
          light: "#E5E7EB",
          dark: "#374151"
        },
        background: {
          main: "#FFFFFF",
          secondary: "#F7F7F7"
        }
      }
    },
  },
  plugins: [],
}
