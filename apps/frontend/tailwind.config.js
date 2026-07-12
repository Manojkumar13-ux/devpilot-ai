/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#13131f",
          light: "#1a1a2e",
          lighter: "#222240",
        },
        glass: {
          DEFAULT: "rgba(26,26,46,0.8)",
          border: "rgba(255,255,255,0.06)",
          hover: "rgba(108,99,255,0.3)",
        },
        neon: {
          purple: "#6c63ff",
          "purple-light": "#8b83ff",
          cyan: "#00d4ff",
          green: "#00e676",
          red: "#ff5252",
          amber: "#ffd740",
        },
        text: {
          primary: "#ffffff",
          secondary: "#a0a0b8",
          muted: "#6b6b85",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["Fira Code", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        hover: "0 8px 32px rgba(108,99,255,0.15)",
        glow: "0 0 40px rgba(108,99,255,0.1)",
        "glow-cyan": "0 0 40px rgba(0,212,255,0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-card": "linear-gradient(135deg, rgba(108,99,255,0.06), rgba(0,212,255,0.03))",
        "gradient-primary": "linear-gradient(135deg, #6c63ff, #8b83ff)",
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(108,99,255,0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(108,99,255,0.3)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
