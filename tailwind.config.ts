import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#161513",
        paper: "#fbfaf8",
        hairline: "#e7e4df",
        muted: "#8a857c",
        // Editorial accents for the five trend pillars — saturated enough to
        // read as filled color blocks with dark text, still low-key.
        art: "#b48fd6",
        fashion: "#ec8fb0",
        entertainment: "#7eb3e6",
        innovation: "#82d2ad",
        "pop-culture": "#f0b95f",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      letterSpacing: {
        editorial: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
