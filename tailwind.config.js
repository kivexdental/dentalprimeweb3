/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dental: {
          bg: '#F4F1EB',
          white: '#FFFFFF',
          black: '#171717',
          charcoal: '#252525',
          gray: '#6F6B65',
          border: '#D7D2C9',
          beige: '#E9E4DC',
          accent: '#B9B1A5',
          dark: '#151515',
        },
        veloura: {
          red: '#C2644F',
          'red-hover': '#a85441',
          'red-light': '#f3dfdb',
          sage: '#779580',
          'sage-light': '#e8f5e9',
          blue: '#83A9D0',
          'blue-light': '#eef4f9',
          cream: '#F8F2E5',
          'cream-alt': '#F9FBF3',
          dark: '#03090D',
          muted: '#5e6b73',
          border: '#D3CFC5',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        script: ['"Caveat"', 'cursive'],
        outfit: ['"Outfit"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.15em',
        ultra: '.25em',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'luxury': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 30px -10px rgba(23, 23, 23, 0.08)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
