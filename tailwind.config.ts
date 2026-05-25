import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7f3",
          100: "#ffece1",
          200: "#ffd2b8",
          300: "#ffb085",
          400: "#ff8a4d",
          500: "#ff6a1f",
          600: "#f04e0a",
          700: "#c63a09",
          800: "#9a3010",
          900: "#7c2a11",
        },
        ink: {
          900: "#0e0f12",
          800: "#1c1f24",
          700: "#2b2f37",
          500: "#6b7280",
          300: "#d1d5db",
          100: "#f3f4f6",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Pretendard", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(15, 23, 42, 0.12)",
        card: "0 2px 8px -2px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
