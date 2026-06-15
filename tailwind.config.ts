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
        border: "var(--color-outline-variant)",
        input: "var(--color-outline-variant)",
        ring: "var(--color-primary)",
        background: "var(--color-background)",
        foreground: "var(--color-on-background)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-on-primary)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-on-secondary)",
        },
        destructive: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-on-error)",
        },
        muted: {
          DEFAULT: "var(--color-surface-container)",
          foreground: "var(--color-outline)",
        },
        accent: {
          DEFAULT: "var(--color-tertiary)",
          foreground: "var(--color-on-tertiary)",
        },
        card: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-on-surface)",
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
