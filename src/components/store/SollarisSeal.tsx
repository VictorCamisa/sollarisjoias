/**
 * SollarisSeal — Logo selo "S" dentro de círculo, conforme Brand Book v2.0.
 *
 * Regra (Brand Book Maison): "Sem raios de sol perto da palavra Sollaris.
 * O luxo não desenha o que fala."
 *
 * Variantes:
 *  - tone="bordeaux" → selo bordeaux sólido, S em creme
 *  - tone="creme"    → selo creme com ring bordeaux, S em bordeaux
 *  - tone="ink"      → selo escuro
 *  - tone="outline"  → só anel bordeaux, S em bordeaux
 */
import { cn } from "@/lib/utils";

type Tone = "bordeaux" | "creme" | "ink" | "outline" | "gold";

interface SollarisSealProps {
  size?: number;
  tone?: Tone;
  className?: string;
  withRing?: boolean;
  monogram?: string; // default "S"
}

const SollarisSeal = ({
  size = 48,
  tone = "bordeaux",
  className,
  withRing = true,
  monogram = "S",
}: SollarisSealProps) => {
  const palette = {
    bordeaux: {
      bg: "hsl(var(--maison-bordeaux))",
      fg: "hsl(var(--maison-creme))",
      ring: "hsl(var(--maison-gold) / 0.7)",
    },
    creme: {
      bg: "hsl(var(--maison-creme))",
      fg: "hsl(var(--maison-bordeaux))",
      ring: "hsl(var(--maison-bordeaux) / 0.4)",
    },
    ink: {
      bg: "hsl(var(--maison-ink))",
      fg: "hsl(var(--maison-creme))",
      ring: "hsl(var(--maison-gold) / 0.6)",
    },
    outline: {
      bg: "transparent",
      fg: "hsl(var(--maison-bordeaux))",
      ring: "hsl(var(--maison-bordeaux))",
    },
    gold: {
      bg: "transparent",
      fg: "hsl(var(--maison-gold))",
      ring: "hsl(var(--maison-gold))",
    },
  }[tone];

  const fontSize = size * 0.52;
  const ringInset = size * 0.075;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
      aria-label="Sollaris"
    >
      {/* Outer circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: palette.bg,
          border: tone === "outline" ? `1px solid ${palette.ring}` : "none",
        }}
      />
      {/* Inner gold ring */}
      {withRing && tone !== "outline" && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: ringInset,
            left: ringInset,
            right: ringInset,
            bottom: ringInset,
            border: `0.5px solid ${palette.ring}`,
          }}
        />
      )}
      {/* Monogram */}
      <span
        className="relative leading-none"
        style={{
          fontFamily: "'Bodoni Moda', Didot, serif",
          fontSize,
          color: palette.fg,
          fontWeight: 400,
          letterSpacing: "0.01em",
          marginTop: -size * 0.02,
        }}
      >
        {monogram}
      </span>
    </div>
  );
};

export default SollarisSeal;
