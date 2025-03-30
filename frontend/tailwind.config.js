// tailwind.config.js
module.exports = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        retro: ['"Press Start 2P"', 'cursive'],
      },
      colors: {
        primary: '#fca311', // bright orange-yellow
        secondary: '#14213d', // deep blue
        accent: '#e5e5e5', // light gray
        bg: '#000000', // black background for high contrast
      },
    },
  },
  plugins: [],
}