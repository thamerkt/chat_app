module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grayCustom: '#C7C7C7',
      },
      fontFamily: {
      bebas: ['"Bebas Neue"', 'sans-serif'],
      sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'], // Add a regular font stack
    },
      fontSize: {
        heroMain: '150px',
        heroSub: '67.2px',
        heroParagraph: '24px',
      },
    },
  },
  plugins: [],
}
