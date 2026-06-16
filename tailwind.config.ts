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
        surface: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-on-surface)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-on-primary)",
          hover: "var(--color-primary-hover)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-on-secondary)",
          hover: "var(--color-secondary-hover)",
        },
        destructive: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-on-error)",
          hover: "var(--color-error-hover)",
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
