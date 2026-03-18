import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx}", "./index.html"],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["'DM Sans'", "sans-serif"],
      display: ["'Syne'", "sans-serif"],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        "border-2": "hsl(246 54% 86%)",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "hsl(249 72% 60%)",
          darker: "hsl(245 53% 52%)",
          bg: "hsl(251 100% 97%)",
          light: "hsl(249 100% 87%)",
        },
        surface: "hsl(0 0% 100%)",
        ink: {
          DEFAULT: "hsl(249 33% 8%)",
          2: "hsl(248 17% 27%)",
          3: "hsl(248 10% 52%)",
          4: "hsl(247 13% 69%)",
        },
        success: {
          DEFAULT: "hsl(153 70% 45%)",
          bg: "hsl(138 76% 97%)",
          text: "hsl(143 64% 24%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)",
          bg: "hsl(48 100% 96%)",
          text: "hsl(28 83% 31%)",
        },
        danger: {
          DEFAULT: "hsl(0 84% 60%)",
          bg: "hsl(0 93% 94%)",
          text: "hsl(0 70% 35%)",
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
