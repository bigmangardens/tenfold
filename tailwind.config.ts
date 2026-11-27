import type { Config } from "tailwindcss";

// Tenfold "night arcade" palette: deep violet night, gold loot, tiered rarity colours.
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    // Square pixel corners everywhere; only fully round shapes (avatars, dots) stay round.
    borderRadius: {
      none: "0",
      sm: "0",
      DEFAULT: "0",
      md: "0",
      lg: "0",
      xl: "0",
      "2xl": "0",
      "3xl": "0",
      full: "9999px",
    },
    extend: {
      colors: {
        ink: {
          950: "#0B0820",
          900: "#120E2E",
          850: "#18123A",
          800: "#1F1849",
          700: "#2A2160",
          600: "#3A2F7E",
          500: "#544899",
          400: "#8C82C4",
          300: "#B5ACE0",
          200: "#D8D2F4",
          100: "#F4F1FF",
        },
        brand: { DEFAULT: "#FFC83D", 400: "#FFD96B", 600: "#D99A00" },
        aqua: "#4EE3FF",
        flame: "#FF8A3D",
        good: "#5CE07A",
        bad: "#FF5470",
        tier: {
          common: "#A9A4C8",
          uncommon: "#5CE07A",
          rare: "#4EA8FF",
          epic: "#C26BFF",
          legendary: "#FFC83D",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-monospace", "monospace"],
        display: ["var(--font-sans)", "ui-monospace", "monospace"],
        arcade: ["var(--font-arcade)", "var(--font-sans)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 3px #000, 0 6px 0 0 #000",
        card: "6px 6px 0 0 rgba(0,0,0,.55)",
        pixel: "4px 4px 0 0 #000",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(.9)" }, "60%": { transform: "scale(1.06)" }, "100%": { transform: "scale(1)" } },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        twinkle: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
        bob: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        blink: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
      },
      animation: {
        "fade-up": "fade-up .35s steps(6) both",
        pop: "pop .3s steps(4)",
        shake: "shake .25s steps(2) 2",
        shimmer: "shimmer 2.5s linear infinite",
        twinkle: "twinkle 3s steps(3) infinite",
        bob: "bob 2.4s steps(4) infinite",
        blink: "blink 1s steps(1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
