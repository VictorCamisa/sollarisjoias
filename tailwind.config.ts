import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter Tight", "system-ui", "sans-serif"],
        display: ["Bodoni Moda", "Didot", "serif"], // Maison storefront
        serif: ["Bodoni Moda", "Didot", "serif"],   // Maison storefront
        mono: ["JetBrains Mono", "Courier New", "monospace"], // Maison captions
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1.4" }],
        "display-lg": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display": ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-sm": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
      },
      letterSpacing: {
        "brand": "0.1em",
        "brand-wide": "0.15em",
        "brand-ultra": "0.2em",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        sollaris: {
          obsidiana: "hsl(var(--sollaris-obsidiana))",
          "obsidiana-light": "hsl(var(--sollaris-obsidiana-light))",
          champagne: "hsl(var(--sollaris-champagne))",
          "champagne-light": "hsl(var(--sollaris-champagne-light))",
          "champagne-pale": "hsl(var(--sollaris-champagne-pale))",
          white: "hsl(var(--sollaris-white))",
          midnight: "hsl(var(--sollaris-midnight))",
        },
        maison: {
          bordeaux: "hsl(var(--maison-bordeaux))",
          "bordeaux-deep": "hsl(var(--maison-bordeaux-deep))",
          "bordeaux-soft": "hsl(var(--maison-bordeaux-soft))",
          creme: "hsl(var(--maison-creme))",
          "creme-warm": "hsl(var(--maison-creme-warm))",
          gold: "hsl(var(--maison-gold))",
          "gold-soft": "hsl(var(--maison-gold-soft))",
          ink: "hsl(var(--maison-ink))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        hub: {
          comercial: "hsl(var(--hub-comercial))",
          operacao: "hsl(var(--hub-operacao))",
          financas: "hsl(var(--hub-financas))",
        },
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "notion-sm": "0 1px 2px hsl(234 22% 9% / 0.04), 0 1px 1px hsl(234 22% 9% / 0.03)",
        "notion-md": "0 2px 4px hsl(234 22% 9% / 0.04), 0 4px 12px hsl(234 22% 9% / 0.06)",
        "notion-lg": "0 4px 8px hsl(234 22% 9% / 0.05), 0 12px 32px hsl(234 22% 9% / 0.10)",
        "soft": "0 2px 8px -2px rgba(0, 0, 0, 0.08)",
        "subtle": "0 1px 3px 0 rgba(0, 0, 0, 0.06)",
        "elevated": "0 8px 30px -10px rgba(0, 0, 0, 0.15)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
        "scale-in": "scale-in 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
