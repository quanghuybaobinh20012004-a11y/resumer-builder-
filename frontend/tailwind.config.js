/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        topcv: {
          primary: '#00b14f', // The signature green
          dark: '#004b23',    
        },
        cv: {
          orange: '#ec8f00', // The orange from the CV template
        }
      }
    },
  },
  plugins: [],
}