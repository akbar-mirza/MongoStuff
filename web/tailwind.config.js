/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/react");

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {},
      keyframes: {
        levitate: {
          '0%, 100%': { transform: 'translateY(0)' }, // Start and end position
          '50%': { transform: 'translateY(-10px)' }, // Middle position (levitated)
        },
      },
      animation: {
        levitate: 'levitate 2s ease-in-out infinite', // Custom animation
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      prefix: "nextui", // prefix for themes variables
      addCommonColors: true, // override common colors (e.g. "blue", "green", "pink").
      defaultTheme: "dark", // default theme from the themes object
      defaultExtendTheme: "dark", // default theme to extend on custom themes
      layout: {}, // common layout tokens (applied to all themes)
      themes: {
        light: {
          layout: {}, // light theme layout tokens
          colors: {
            primary: "#00684a",
            secondary: "#00ee64",
          }, // light theme colors
        },
        dark: {
          layout: {}, // dark theme layout tokens
          colors: {
            primary: {
              DEFAULT: "#02ec64",
              50: "#00b64f",
            },
            secondary: "#13813e",
          },
        },
        // ... custom themes
      },
    }),
  ],
};
