/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        github: {
          bg: '#0D1117',
          surface: '#161B22',
          border: '#30363D',
          text: '#C9D1D9',
          muted: '#8B949E',
          dimmed: '#6E7681',
          blue: '#58A6FF',
          green: '#3FB950',
          coral: '#F78166',
          yellow: '#D29922',
          purple: '#BC8CFF',
          red: '#F85149',
        },
        primary: {
          50: '#EBF5FF',
          100: '#C8E1FF',
          200: '#A5CDFF',
          300: '#82B8FF',
          400: '#6EA9FF',
          500: '#58A6FF',
          600: '#3D8BFF',
          700: '#2D70D4',
          800: '#1F54A8',
          900: '#13397D'
        },
        surface: {
          50: '#F0F6FC',
          100: '#C9D1D9',
          200: '#B1BAC4',
          300: '#8B949E',
          400: '#6E7681',
          500: '#484F58',
          600: '#30363D',
          700: '#21262D',
          800: '#161B22',
          900: '#0D1117',
          hover: 'rgba(88, 166, 255, 0.08)'
        },
        danger: { DEFAULT: '#F85149', light: 'rgba(248, 81, 73, 0.12)', dark: '#DA3633' },
        warning: { DEFAULT: '#D29922', light: 'rgba(210, 153, 34, 0.12)', dark: '#BB8009' },
        safe: { DEFAULT: '#3FB950', light: 'rgba(63, 185, 80, 0.12)', dark: '#2EA043' },
      },
      borderRadius: {
        '2xl': '0.75rem',
        '3xl': '1rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }]
      },
      animation: {
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: 0, transform: 'translateY(-8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 }
        }
      }
    }
  },
  plugins: []
}
