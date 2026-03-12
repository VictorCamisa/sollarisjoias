import { Link } from "react-router-dom";
import logoSollaris from "@/assets/logo-sollaris-tight.png";

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
      {/* Image container */}
      <div className="aspect-[3/4] bg-secondary overflow-hidden mb-4 relative border border-transparent group-hover:border-accent/30 transition-all duration-500">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-2xl text-muted-foreground/30 tracking-[0.1em]">S</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-500" />

        {/* Logo watermark */}
        <img
          src={logoSollaris}
          alt=""
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[55%] h-auto drop-shadow-md opacity-80 group-hover:opacity-100 transition-opacity duration-500"
        />

        {/* Slide-up info overlay on hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out bg-gradient-to-t from-background/90 via-background/60 to-transparent">
          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-accent mb-1">
            Ver detalhes
          </p>
        </div>
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
