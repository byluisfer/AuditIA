import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode
        "auditia-dark": {
          bg: "#020402",
          text: "#A7F3D0",
          primary: "#22C55E",
          secondary: "#4ADE80",
          accent: "#86EFAC",
        },
        // Light mode
        "auditia-light": {
          bg: "#F0FDF4",
          text: "#052E16",
          primary: "#16A34A",
          secondary: "#22C55E",
          accent: "#4ADE80",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "auditia-gradient":
          "linear-gradient(to bottom right, var(--color-green-400), var(--color-green-600))",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

export default config;
