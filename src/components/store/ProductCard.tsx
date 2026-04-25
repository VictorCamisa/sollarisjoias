import { Link } from "react-router-dom";
import logoSollaris from "@/assets/logo-sollaris-tight.png";
import { ArrowRight, Flame, Sparkles } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string | null;
  category?: string | null;
  /** estoque restante */
  stockQuantity?: number | null;
  /** data ISO de criação — para badge "Novo" */
  createdAt?: string | null;
  /** desconto extra no PIX (em %) — default 5 */
  pixDiscountPercent?: number;
  /** parcelamento sem juros — default 4 */
  installments?: number;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  stockQuantity,
  createdAt,
  pixDiscountPercent = 5,
  installments = 4,
}: ProductCardProps) => {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const pixPrice = price * (1 - pixDiscountPercent / 100);
  const installmentValue = price / installments;

  // Heuristics
  const isLowStock = typeof stockQuantity === "number" && stockQuantity > 0 && stockQuantity <= 3;
  const isNew = createdAt
    ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 14
    : false;

  // Choose top-left badge — priority: discount > low stock > new
  const topBadge = hasDiscount
    ? { label: `-${discountPercent}%`, tone: "accent" as const, icon: null }
    : isLowStock
    ? { label: `Restam ${stockQuantity}`, tone: "warn" as const, icon: <Flame className="h-2.5 w-2.5" /> }
    : isNew
    ? { label: "Novo", tone: "muted" as const, icon: <Sparkles className="h-2.5 w-2.5" /> }
    : null;

  return (
    <Link to={`/produto/${id}`} className="group block">
      {/* Image container */}
      <div className="aspect-[3/4] bg-secondary overflow-hidden mb-3.5 relative rounded-2xl border border-transparent group-hover:border-accent/20 transition-all duration-700 shadow-subtle group-hover:shadow-elevated">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-all duration-[900ms] ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary rounded-2xl">
            <span className="font-serif text-3xl text-muted-foreground/20 tracking-[0.1em]">S</span>
          </div>
        )}

        {/* Dark hover overlay */}
        <div className="absolute inset-0 rounded-2xl bg-background/0 group-hover:bg-background/25 transition-all duration-700" />

        {/* Top-left badge */}
        {topBadge && (
          <div
            className={
              "absolute top-3 left-3 flex items-center gap-1 font-sans text-[9px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full backdrop-blur-md " +
              (topBadge.tone === "accent"
                ? "bg-accent text-accent-foreground"
                : topBadge.tone === "warn"
                ? "bg-amber-500/90 text-background"
                : "bg-background/70 text-foreground border border-border/40")
            }
          >
            {topBadge.icon}
            {topBadge.label}
          </div>
        )}

        {/* Top-right secondary badge — PIX off */}
        {!hasDiscount && pixDiscountPercent > 0 && (
          <div className="absolute top-3 right-3 font-sans text-[9px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md text-accent border border-accent/30">
            -{pixDiscountPercent}% no Pix
          </div>
        )}

        {/* Logo watermark */}
        <img
          src={logoSollaris}
          alt=""
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[50%] h-auto drop-shadow-md opacity-70 group-hover:opacity-0 transition-opacity duration-500"
        />

        {/* Hover CTA overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
          <div className="flex items-center justify-center gap-2 font-sans text-[10px] tracking-[0.2em] uppercase text-accent bg-background/80 backdrop-blur-sm rounded-full py-2.5 px-4 mx-auto w-fit">
            Ver detalhes
            <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Info */}
      {category && (
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-accent/70 mb-1">
          {category}
        </p>
      )}
      <h3 className="font-sans text-sm text-foreground group-hover:text-accent transition-colors duration-500 leading-snug line-clamp-2 min-h-[2.5em]">
        {name}
      </h3>

      {/* Price block */}
      <div className="mt-1.5 space-y-0.5">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[15px] text-foreground font-medium tabular-nums">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="font-sans text-[11px] text-muted-foreground line-through tabular-nums">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        <p className="font-sans text-[10px] text-muted-foreground tabular-nums">
          ou <span className="text-accent">{formatPrice(pixPrice)}</span> no Pix
        </p>
        <p className="font-sans text-[10px] text-muted-foreground tabular-nums">
          em até <span className="text-foreground">{installments}× {formatPrice(installmentValue)}</span> sem juros
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
