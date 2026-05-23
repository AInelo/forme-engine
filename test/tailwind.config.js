/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../form-engine/**/*.{tsx,ts,jsx,js}",
    "../form-engine/internal/**/*.{tsx,ts}",
  ],
  theme: {
    extend: {
      screens: {
        laptop: "1024px",
      },
      colors: {
        primary: {
          DEFAULT: "#008080",
          dark: "#006666",
        },
      },
    },
  },
  plugins: [],
};
