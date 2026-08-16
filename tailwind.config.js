/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FBF8F2',
          100: '#F7F3EC',
          200: '#EFE8DA',
          300: '#E3D9C4',
        },
        sand: {
          400: '#C9B89A',
          500: '#B8A57E',
          600: '#9C8A65',
        },
        sage: {
          50: '#F0F5F0',
          100: '#DCE9DC',
          400: '#7FAE8C',
          500: '#5E9270',
          600: '#497A59',
          700: '#3A6147',
        },
        coral: {
          50: '#FDF2F0',
          100: '#FBE5E1',
          400: '#E8968A',
          500: '#D96B5C',
          600: '#C04D3E',
          700: '#9E3B2E',
        },
        amber: {
          soft: '#F4E4C1',
          deep: '#C98A2B',
        },
        slatey: {
          900: '#2B2823',
          800: '#3A372F',
          700: '#4A463B',
        },
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
        '7xl': ['4.5rem', { lineHeight: '1.0' }],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(43, 40, 35, 0.08), 0 8px 30px -6px rgba(43, 40, 35, 0.06)',
        card: '0 1px 3px rgba(43, 40, 35, 0.06), 0 10px 40px -12px rgba(43, 40, 35, 0.12)',
        glow: '0 0 0 4px rgba(94, 146, 112, 0.18)',
        glowCoral: '0 0 0 4px rgba(217, 107, 92, 0.22)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 400ms ease-out both',
        'slide-up': 'slideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in': 'slideIn 450ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'breath': 'breath 3.5s ease-in-out infinite',
        'shake-soft': 'shakeSoft 600ms ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        breath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        shakeSoft: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
