import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        mono: ['DM Mono', 'monospace'],
        sans: ['Sora', 'sans-serif'],
      },
      colors: {
        ink: '#0D0D0D',
        paper: '#FAF9F6',
        amber: {
          DEFAULT: '#E8A020',
          light: '#FDF3DC',
          dark: '#B87D10',
        },
        slate: {
          50: '#F8F8F7',
          100: '#F0EFEC',
          200: '#E2E0DB',
          300: '#C9C6BE',
          400: '#9E9A91',
          500: '#716D63',
          600: '#504D45',
          700: '#3A3730',
          800: '#28261F',
          900: '#1A1814',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
export default config
