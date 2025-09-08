/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(0, 0, 0, 0.1)",
        primary: "#030213",
        muted: "#717182",
        background: "#F3F3F5",
        card: "#FFFFFF",
        destructive: "#D4183D",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "12.75px",
        md: "8.75px",
        sm: "6.75px",
      },
    },
  },
  plugins: [],
}
