import { Link } from "react-router-dom";
import logoSollaris from "@/assets/logo-sollaris.png";

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

  return (
    <Link to={`/produto/${id}`} className="group block">
      {/* Image */}
      <div className="aspect-[3/4] bg-secondary overflow-hidden mb-4 relative">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-2xl text-muted-foreground/30 tracking-[0.1em]">S</span>
          </div>
        )}
        <img
          src={logoSollaris}
          alt=""
          className="absolute bottom-3 right-3 h-3 opacity-50"
        />
      </div>

      {/* Info */}
      {category && (
        <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
          {category}
        </p>
      )}
      <h3 className="font-sans text-sm text-foreground group-hover:text-accent transition-colors duration-300">
        {name}
      </h3>
      <div className="flex items-center gap-2 mt-1">
        <span className="font-sans text-sm text-foreground">{formatPrice(price)}</span>
        {originalPrice && originalPrice > price && (
          <span className="font-sans text-xs text-muted-foreground line-through">
            {formatPrice(originalPrice)}
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
