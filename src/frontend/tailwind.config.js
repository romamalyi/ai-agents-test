/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        'leobit-green': '#36b802',
        'leobit-light-green': '#7fca03'
      },
      maxWidth: {
        'content-frame': 'calc(1224px + 21px + 21px)'
      },
      fontFamily: {
        'futura-bold': ['Futura Bold', 'sans-serif'],
        'futura-extra-black': ['Futura Extra Black', 'sans-serif'],
        'source-sans-pro': ['Source Sans Pro', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
