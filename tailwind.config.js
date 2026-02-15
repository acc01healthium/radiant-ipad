
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'clinic-gold': '#D4AF37',
        'clinic-rose': '#E0B0FF',
        'clinic-cream': '#FDFBF7',
        'clinic-dark': '#2D2D2D',
      },
      backgroundImage: {
        'rose-gradient': 'linear-gradient(135deg, #E0B0FF 0%, #F8E8FF 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F3E5AB 100%)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
