/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        workspace: {
          bg: '#090d16',
          surface: '#0f172a',
          card: '#131b2e',
          cardHover: '#18223a',
          border: 'rgba(99, 102, 241, 0.18)',
          glow: 'rgba(129, 140, 248, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2.5s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%': { top: '0%', opacity: '0.8' },
          '50%': { top: '95%', opacity: '1' },
          '100%': { top: '0%', opacity: '0.8' },
        },
        glow: {
          '0%': { filter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.3))' },
          '100%': { filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.5))' },
        }
      }
    },
  },
  plugins: [],
}
