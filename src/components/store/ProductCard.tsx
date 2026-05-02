import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import SollarisSeal from "./SollarisSeal";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string | null;
  category?: string | null;
  stockQuantity?: number | null;
  createdAt?: string | null;
  pixDiscountPercent?: number;
  installments?: number;
  /** força badge editorial específica */
  badge?: "mais-desejado" | "edicao-limitada" | "novidade" | null;
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
  installments = 6,
  badge,
}: ProductCardProps) => {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const hasDiscount = originalPrice && originalPrice > price;
  const installmentValue = price / installments;

  // Heuristic badges (Brand Book)
  const isLowStock = typeof stockQuantity === "number" && stockQuantity > 0 && stockQuantity <= 2;
  const isNew = createdAt
    ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 14
    : false;

  // Resolve final badge
  const finalBadge =
    badge ??
    (isLowStock ? "edicao-limitada" : isNew ? "novidade" : null);

  const badgeLabel = {
    "mais-desejado": "Mais Desejado",
    "edicao-limitada": "Edição Limitada",
    "novidade": "Novidade",
  };

  return (
    <Link to={`/produto/${id}`} className="group block">
      {/* Image container — editorial 4:5, hover sutil */}
      <div className="aspect-[4/5] bg-maison-creme-warm overflow-hidden mb-5 relative">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.035]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-maison-creme-warm">
            <SollarisSeal size={56} tone="outline" />
          </div>
        )}

        {/* Hairline border que aparece no hover */}
        <div className="absolute inset-0 border border-transparent group-hover:border-maison-bordeaux/20 transition-colors duration-700 pointer-events-none" />

        {/* Editorial badge top-left */}
        {finalBadge && (
          <div className="absolute top-3 left-3">
            <span
              className={
                finalBadge === "edicao-limitada"
                  ? "maison-badge-gold"
                  : finalBadge === "mais-desejado"
                  ? "maison-badge-dark"
                  : "maison-badge"
              }
            >
              {badgeLabel[finalBadge]}
            </span>
          </div>
        )}

        {/* Discount badge top-right (subtle) */}
        {hasDiscount && (
          <div className="absolute top-3 right-3">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-maison-bordeaux bg-maison-creme/90 px-2 py-1">
              −{Math.round(((originalPrice! - price) / originalPrice!) * 100)}%
            </span>
          </div>
        )}

        {/* Heart wishlist — bottom right, appears on hover */}
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-maison-creme/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-maison-bordeaux hover:text-maison-creme"
          aria-label="Favoritar"
        >
          <Heart className="h-3.5 w-3.5" strokeWidth={1.4} />
        </button>
      </div>

      {/* Info */}
      {category && (
        <p className="font-mono text-[9.5px] tracking-[0.28em] uppercase text-bordeaux/70 mb-1.5">
          {category}
        </p>
      )}
      <h3 className="font-display text-[15px] sm:text-base text-foreground group-hover:text-bordeaux transition-colors duration-500 leading-snug line-clamp-2 min-h-[2.6em] mb-1.5">
        {name}
      </h3>

      {/* Price block — Maison style */}
      <div className="space-y-0.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-display text-[16px] text-foreground tabular-nums">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="font-mono text-[10.5px] text-foreground/40 line-through tabular-nums">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] tracking-[0.05em] text-foreground/55 tabular-nums">
          em {installments}× <span className="text-bordeaux">{formatPrice(installmentValue)}</span> s/ juros
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
