import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07080D",
          900: "#0C0E15",
          850: "#11141D",
          800: "#161A25",
          700: "#1F2432",
          600: "#2A3042",
          500: "#3A4157",
          400: "#6B7390",
          300: "#9AA2BD",
          200: "#C9CEDF",
          100: "#EEF0F7",
        },
        brand: { DEFAULT: "#7C5CFF", 400: "#9B83FF", 600: "#6142F0" },
        aqua: "#22D3EE",
        flame: "#FFB547",
        good: "#34D399",
        bad: "#F87171",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,.35), 0 10px 40px -10px rgba(124,92,255,.55)",
        card: "0 1px 0 0 rgba(255,255,255,.04) inset, 0 20px 50px -30px rgba(0,0,0,.8)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(.96)" }, "60%": { transform: "scale(1.03)" }, "100%": { transform: "scale(1)" } },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: {
        "fade-up": "fade-up .45s cubic-bezier(.2,.7,.2,1) both",
        pop: "pop .35s ease-out",
        shake: "shake .3s ease-in-out 2",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
