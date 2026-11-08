/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#060B18',
          850: '#0B132B',
          800: '#111D4A',
          700: '#1C2E6A',
          600: '#284293'
        },
        electric: {
          blue: '#00F0FF',
          cyan: '#05D9E8',
          purple: '#7928CA',
          indigo: '#5800FF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
