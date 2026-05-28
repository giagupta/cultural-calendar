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
        // Low-saturation editorial accents for the five trend pillars.
        art: "#c9a8e0",
        fashion: "#f2a6c0",
        entertainment: "#9fc5e8",
        innovation: "#a8e0c5",
        "pop-culture": "#f4c98a",
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
