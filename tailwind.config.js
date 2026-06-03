/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0b1020", // page background
        panel: "#1b2342", // cards / widget surface
        line: "#2a3357", // borders
        ink: "#eef1fb", // primary text
        muted: "#9aa4c8", // secondary text
        accent: "#4f8cff", // brand / highlight
        track: "#0e1430", // empty bar track / option bg
      },
    },
  },
  plugins: [],
};
