import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FDF5F2',
          100: '#FAE8E1',
          200: '#F5CFC3',
          300: '#EDB09E',
          400: '#E08B73',
          500: '#D4664A',
          600: '#C14E33',
          700: '#A23D27',
          800: '#84311F',
          900: '#6B2619',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
