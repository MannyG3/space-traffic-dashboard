/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-blue': '#0B1426',
        'space-dark': '#1A2332',
        'space-light': '#2A3441',
        'accent-blue': '#00D4FF',
        'accent-green': '#00FF88',
        'accent-red': '#FF4757',
        'accent-yellow': '#FFA502'
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
