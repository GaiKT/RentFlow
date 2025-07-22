import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#2563eb",
          "primary-content": "#ffffff",
          secondary: "#059669",
          "secondary-content": "#ffffff",
          accent: "#d97706",
          "accent-content": "#ffffff",
          neutral: "#374151",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#e2e8f0",
          "base-content": "#000000",
          info: "#0ea5e9",
          "info-content": "#ffffff",
          success: "#059669",
          "success-content": "#ffffff",
          warning: "#d97706",
          "warning-content": "#ffffff",
          error: "#dc2626",
          "error-content": "#ffffff",
        },
        dark: {
          primary: "#3b82f6",
          "primary-content": "#ffffff",
          secondary: "#10b981",
          "secondary-content": "#ffffff",
          accent: "#f59e0b",
          "accent-content": "#000000",
          neutral: "#6b7280",
          "neutral-content": "#ffffff",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#f1f5f9",
          info: "#06b6d4",
          "info-content": "#ffffff",
          success: "#10b981",
          "success-content": "#ffffff",
          warning: "#f59e0b",
          "warning-content": "#000000",
          error: "#ef4444",
          "error-content": "#ffffff",
        },
      },
    ],
  },
};

export default config;
