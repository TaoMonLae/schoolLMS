import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        moss: "#47624f",
        leaf: "#6e8f5f",
        clay: "#b46a45",
        rice: "#f8f5ee",
        line: "#ded8cb"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 33, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
