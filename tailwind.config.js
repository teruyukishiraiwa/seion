/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light: white / 生成り / 淡いグレー / 薄いベージュ
        paper: {
          DEFAULT: "#faf8f4",
          panel: "#ffffff",
          soft: "#f3f0ea",
        },
        // Dark: 深いチャコール / 墨色 / 暗いグレー
        ink: {
          DEFAULT: "#1c1b1a",
          panel: "#232220",
          soft: "#2b2a28",
        },
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        overlayIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        dialogIn: {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        riseIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 220ms ease-out both",
        overlayIn: "overlayIn 200ms ease-out both",
        dialogIn: "dialogIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        riseIn: "riseIn 260ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      fontFamily: {
        mincho: [
          '"Hiragino Mincho ProN"',
          '"Yu Mincho"',
          '"YuMincho"',
          '"Noto Serif JP"',
          "serif",
        ],
        gothic: [
          '"Hiragino Sans"',
          '"Yu Gothic"',
          '"YuGothic"',
          '"Noto Sans JP"',
          "sans-serif",
        ],
        serif: ["Georgia", '"Times New Roman"', "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
