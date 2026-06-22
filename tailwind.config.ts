import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--color-outline-variant) / <alpha-value>)",
        input: "hsl(var(--color-outline-variant) / <alpha-value>)",
        ring: "hsl(var(--color-primary) / <alpha-value>)",
        background: "hsl(var(--color-background) / <alpha-value>)",
        foreground: "hsl(var(--color-on-background) / <alpha-value>)",
        surface: {
          DEFAULT: "hsl(var(--color-surface) / <alpha-value>)",
          foreground: "hsl(var(--color-on-surface) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
          foreground: "hsl(var(--color-on-primary) / <alpha-value>)",
          hover: "hsl(var(--color-primary-hover) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-secondary) / <alpha-value>)",
          foreground: "hsl(var(--color-on-secondary) / <alpha-value>)",
          hover: "hsl(var(--color-secondary-hover) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--color-error) / <alpha-value>)",
          foreground: "hsl(var(--color-on-error) / <alpha-value>)",
          hover: "hsl(var(--color-error-hover) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--color-surface-variant) / <alpha-value>)",
          foreground: "hsl(var(--color-outline) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--color-tertiary) / <alpha-value>)",
          foreground: "hsl(var(--color-on-tertiary) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--color-surface) / <alpha-value>)",
          foreground: "hsl(var(--color-on-surface) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
