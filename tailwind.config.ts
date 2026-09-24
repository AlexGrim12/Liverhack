import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // El rosa magenta de liverpool.com.mx (#E10098 / #CD008A, verificado
        // directamente contra el sitio) se usa como color de ACENTO —
        // detalles puntuales, no la superficie dominante. Lo estructural
        // (botones, navegación, texto de énfasis) usa un neutro casi negro,
        // que también es parte real de la identidad de Liverpool.
        liverpool: {
          pink: {
            DEFAULT: "#E10098",
            hover: "#CD008A",
            light: "#FDF0F8",
            border: "#F9CBE7",
          },
        },
        primary: {
          DEFAULT: "#1A1A1A",
          hover: "#000000",
          dark: "#000000",
          light: "#4D4D4D",
          tint: "#F2F2F2",
          border: "#E0E0E0",
        },
        accent: {
          DEFAULT: "#E10098",
          hover: "#CD008A",
          dark: "#A30071",
          light: "#FF4FC4",
          tint: "#FDF0F8",
          border: "#F9CBE7",
        },
        ink: {
          DEFAULT: "#000000",
          title: "#000000",
          body: "#333333",
          muted: "#666666",
          subtle: "#999999",
          border: "#E5E5E5",
          light: "#FAFAFA",
        },
        surface: {
          DEFAULT: "#FAFAFA",
          canvas: "#FAFAFA",
          card: "#FFFFFF",
          subtle: "#F5F5F5",
          border: "#E5E5E5",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 8px 20px -4px rgba(225, 0, 152, 0.16), 0 3px 8px -3px rgba(0, 0, 0, 0.06)",
        "pink-glow": "0 4px 16px -2px rgba(225, 0, 152, 0.35)",
        "bottom-nav": "0 -2px 10px rgba(0, 0, 0, 0.08)",
      },
      fontFamily: {
        sans: ["Roboto", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
