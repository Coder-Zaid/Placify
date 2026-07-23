/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        placify: {
          primary: '#0078d4',
          success: '#28a745',
          warning: '#ffc107',
          danger: '#dc3545',
          light: 'rgba(0, 120, 212, 0.05)',
        }
      },
      keyframes: {
        slideIn: {
          '0%': { 
            transform: 'translateX(400px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          }
        }
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out'
      }
    },
  },
  plugins: [],
}
