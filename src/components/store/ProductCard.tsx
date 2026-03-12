import { Link } from "react-router-dom";
import logoSollaris from "@/assets/logo-sollaris-tight.png";
import { ArrowRight } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string | null;
  category?: string | null;
}

const ProductCard = ({ id, name, price, originalPrice, image, category }: ProductCardProps) => {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Link to={`/produto/${id}`} className="group block">
      {/* Image container */}
      <div className="aspect-[3/4] bg-secondary overflow-hidden mb-4 relative rounded-2xl border border-transparent group-hover:border-accent/20 transition-all duration-700 shadow-subtle group-hover:shadow-elevated">
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

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-accent text-accent-foreground font-sans text-[9px] tracking-[0.1em] uppercase px-3 py-1 rounded-full">
            -{discountPercent}%
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
          <div className="flex items-center justify-center gap-2 font-sans text-[10px] tracking-[0.2em] uppercase text-accent bg-background/70 backdrop-blur-sm rounded-full py-2.5 px-4 mx-auto w-fit">
            Ver detalhes
            <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Info */}
      {category && (
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-accent/70 mb-1.5">
          {category}
        </p>
      )}
      <h3 className="font-sans text-sm text-foreground group-hover:text-accent transition-colors duration-500 leading-snug">
        {name}
      </h3>
      <div className="flex items-center gap-2.5 mt-1.5">
        <span className="font-sans text-sm text-foreground font-medium">{formatPrice(price)}</span>
        {hasDiscount && (
          <span className="font-sans text-[11px] text-muted-foreground line-through">
            {formatPrice(originalPrice)}
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
