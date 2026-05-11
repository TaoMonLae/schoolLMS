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
        primary: {
          DEFAULT: "#5645d4",
          pressed: "#4534b3",
          deep: "#3a2a99"
        },
        navy: {
          DEFAULT: "#0a1530",
          deep: "#070f24",
          mid: "#1a2a52"
        },
        link: {
          DEFAULT: "#0075de",
          pressed: "#005bab"
        },
        brand: {
          orange: "#dd5b00",
          pink: "#ff64c8",
          purple: "#7b3ff2",
          teal: "#2a9d99",
          green: "#1aae39",
          yellow: "#f5d75e",
          brown: "#523410"
        },
        tint: {
          peach: "#ffe8d4",
          rose: "#fde0ec",
          mint: "#d9f3e1",
          lavender: "#e6e0f5",
          sky: "#dcecfa",
          yellow: "#fef7d6",
          yellowBold: "#f9e79f",
          cream: "#f8f5e8",
          gray: "#f0eeec"
        },
        canvas: "#ffffff",
        surface: "#f6f5f4",
        surfaceSoft: "#fafaf9",
        hairline: "#e5e3df",
        hairlineSoft: "#ede9e4",
        hairlineStrong: "#c8c4be",
        inkDeep: "#000000",
        ink: "#1a1a1a",
        charcoal: "#37352f",
        slate: "#5d5b54",
        steel: "#787671",
        stone: "#a4a097",
        muted: "#bbb8b1",
        success: "#1aae39",
        warning: "#dd5b00",
        error: "#e03131",
        moss: "#5d5b54",
        clay: "#dd5b00",
        rice: "#f6f5f4",
        line: "#e5e3df"
      },
      fontFamily: {
        sans: ["Notion Sans", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        mockup: "rgba(15, 15, 15, 0.2) 0px 24px 48px -8px",
        soft: "0 18px 45px rgba(15, 15, 15, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
