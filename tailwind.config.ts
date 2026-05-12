import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: withOpacity("--color-primary-rgb"),
          pressed: withOpacity("--color-primary-pressed-rgb"),
          deep: withOpacity("--color-primary-deep-rgb"),
          foreground: withOpacity("--color-on-primary-rgb")
        },
        "on-primary": withOpacity("--color-on-primary-rgb"),
        "brand-navy": {
          DEFAULT: withOpacity("--color-brand-navy-rgb"),
          deep: withOpacity("--color-brand-navy-deep-rgb"),
          mid: withOpacity("--color-brand-navy-mid-rgb")
        },
        navy: {
          DEFAULT: withOpacity("--color-brand-navy-rgb"),
          deep: withOpacity("--color-brand-navy-deep-rgb"),
          mid: withOpacity("--color-brand-navy-mid-rgb")
        },
        link: {
          DEFAULT: withOpacity("--color-link-blue-rgb"),
          pressed: withOpacity("--color-link-blue-pressed-rgb")
        },
        brand: {
          orange: withOpacity("--color-brand-orange-rgb"),
          "orange-deep": withOpacity("--color-brand-orange-deep-rgb"),
          pink: withOpacity("--color-brand-pink-rgb"),
          "pink-deep": withOpacity("--color-brand-pink-deep-rgb"),
          purple: withOpacity("--color-brand-purple-rgb"),
          "purple-300": withOpacity("--color-brand-purple-300-rgb"),
          "purple-800": withOpacity("--color-brand-purple-800-rgb"),
          teal: withOpacity("--color-brand-teal-rgb"),
          green: withOpacity("--color-brand-green-rgb"),
          yellow: withOpacity("--color-brand-yellow-rgb"),
          brown: withOpacity("--color-brand-brown-rgb")
        },
        tint: {
          peach: withOpacity("--color-card-tint-peach-rgb"),
          rose: withOpacity("--color-card-tint-rose-rgb"),
          mint: withOpacity("--color-card-tint-mint-rgb"),
          lavender: withOpacity("--color-card-tint-lavender-rgb"),
          sky: withOpacity("--color-card-tint-sky-rgb"),
          yellow: withOpacity("--color-card-tint-yellow-rgb"),
          "yellow-bold": withOpacity("--color-card-tint-yellow-bold-rgb"),
          yellowBold: withOpacity("--color-card-tint-yellow-bold-rgb"),
          cream: withOpacity("--color-card-tint-cream-rgb"),
          gray: withOpacity("--color-card-tint-gray-rgb")
        },
        background: withOpacity("--color-surface-rgb"),
        card: withOpacity("--color-canvas-rgb"),
        foreground: withOpacity("--color-ink-rgb"),
        "muted-foreground": withOpacity("--color-slate-rgb"),
        border: { DEFAULT: withOpacity("--color-hairline-rgb") },
        secondary: { DEFAULT: withOpacity("--color-surface-rgb"), foreground: withOpacity("--color-ink-rgb") },
        destructive: { DEFAULT: withOpacity("--color-semantic-error-rgb"), foreground: withOpacity("--color-on-primary-rgb") },
        canvas: withOpacity("--color-canvas-rgb"),
        surface: withOpacity("--color-surface-rgb"),
        "surface-soft": withOpacity("--color-surface-soft-rgb"),
        surfaceSoft: withOpacity("--color-surface-soft-rgb"),
        hairline: withOpacity("--color-hairline-rgb"),
        "hairline-soft": withOpacity("--color-hairline-soft-rgb"),
        hairlineSoft: withOpacity("--color-hairline-soft-rgb"),
        "hairline-strong": withOpacity("--color-hairline-strong-rgb"),
        hairlineStrong: withOpacity("--color-hairline-strong-rgb"),
        "ink-deep": withOpacity("--color-ink-deep-rgb"),
        inkDeep: withOpacity("--color-ink-deep-rgb"),
        ink: withOpacity("--color-ink-rgb"),
        charcoal: withOpacity("--color-charcoal-rgb"),
        slate: withOpacity("--color-slate-rgb"),
        steel: withOpacity("--color-steel-rgb"),
        stone: withOpacity("--color-stone-rgb"),
        muted: withOpacity("--color-muted-rgb"),
        "on-dark": withOpacity("--color-on-dark-rgb"),
        "on-dark-muted": withOpacity("--color-on-dark-muted-rgb"),
        success: withOpacity("--color-semantic-success-rgb"),
        warning: withOpacity("--color-semantic-warning-rgb"),
        error: withOpacity("--color-semantic-error-rgb"),
        moss: withOpacity("--color-slate-rgb"),
        clay: withOpacity("--color-brand-orange-rgb"),
        rice: withOpacity("--color-surface-rgb"),
        line: withOpacity("--color-hairline-rgb")
      },
      fontFamily: {
        sans: ["var(--font-notion)"]
      },
      fontSize: {
        "hero-display": ["clamp(3.5rem, 8vw, 5rem)", { lineHeight: "1.05", letterSpacing: "-2px", fontWeight: "600" }],
        "display-lg": ["clamp(2.75rem, 6vw, 3.5rem)", { lineHeight: "1.1", letterSpacing: "-1px", fontWeight: "600" }],
        "heading-1": ["clamp(2.25rem, 5vw, 3rem)", { lineHeight: "1.15", letterSpacing: "-0.5px", fontWeight: "600" }],
        "heading-2": ["clamp(2rem, 4vw, 2.25rem)", { lineHeight: "1.2", letterSpacing: "-0.5px", fontWeight: "600" }],
        "heading-3": ["1.75rem", { lineHeight: "1.25", fontWeight: "600" }],
        "heading-4": ["1.375rem", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-5": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        subtitle: ["1.125rem", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.55", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["0.8125rem", { lineHeight: "1.4", fontWeight: "400" }],
        micro: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }]
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        xxl: "32px",
        xxxl: "40px",
        "section-sm": "48px",
        section: "64px",
        "section-lg": "96px",
        hero: "120px"
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "20px",
        xxxl: "24px"
      },
      boxShadow: {
        mockup: "rgba(15, 15, 15, 0.2) 0px 24px 48px -8px",
        soft: "0 18px 45px rgba(15, 15, 15, 0.08)",
        card: "0 1px 2px rgba(15, 15, 15, 0.04)"
      }
    }
  },
  plugins: []
};

export default config;
