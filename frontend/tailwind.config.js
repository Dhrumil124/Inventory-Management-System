/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F2F7F4',
          100: '#E2ECE6',
          200: '#C5D9CE',
          300: '#9EBFA9',
          400: '#6E9E80',
          500: '#3D785C',
          600: '#2B5E47',
          700: '#224C39',
          800: '#1E3A2F', // Signature dark forest green
          900: '#152921',
          950: '#0D1914',
        },
        accent: {
          50: '#FDF7F2',
          100: '#FDEEE4',
          200: '#FBDAC8',
          300: '#F6BFA6',
          400: '#EE9674',
          500: '#D77259',
          600: '#C2563D',
          700: '#9E3F2A',
          800: '#7E3423',
          900: '#652C1E',
        },
        canvas: {
          DEFAULT: '#FBF9F5',
          warm: '#F7F5F0',
          subtle: '#F3F0E8',
        },
        surface: {
          card: '#FFFFFF',
          subtle: '#FAF8F5',
          muted: '#F2EFE9',
          border: '#EBE7DE',
          'border-light': '#F0ECE4',
          dark: '#1C1917',
          charcoal: '#262626',
        },
        pastel: {
          mint: '#EAF4EE',
          'mint-text': '#27784E',
          peach: '#FDEEE9',
          'peach-text': '#C44D3A',
          sage: '#EAF5F0',
          'sage-text': '#287550',
          blue: '#EDF4F9',
          'blue-text': '#2B638A',
          gray: '#F4F4F4',
          'gray-text': '#4B5563',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 20px -2px rgba(28, 25, 23, 0.06)',
        'dropdown': '0 10px 25px -5px rgba(28, 25, 23, 0.08), 0 8px 10px -6px rgba(28, 25, 23, 0.04)',
      }
    },
  },
  plugins: [],
};
