import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import FavoriteButton from "@/components/store/FavoriteButton";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image?: string;
  category?: string;
  index?: number;
  badge?: string;
}

const ProductCard = ({ id, name, price, originalPrice, image, category, index = 0, badge }: ProductCardProps) => {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link
        to={`/produto/${id}`}
        className="group block relative"
      >
        {/* Image area */}
        <div
          className="aspect-[3/4] rounded-xl overflow-hidden mb-3 relative bg-gradient-to-br from-larifa-nude-light to-larifa-nude"
          style={{
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-larifa-nude-light to-larifa-nude group-hover:scale-105 transition-transform duration-500" />
          )}

          {/* Badges */}
          {badge && (
            <span
              className={cn(
                "absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.05em] font-sans text-primary-foreground",
                badge === "Novo" ? "bg-primary" : badge === "Esgotado" ? "bg-muted-foreground" : "bg-accent"
              )}
            >
              {badge}
            </span>
          )}

          {hasDiscount && !badge && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.05em] font-sans bg-accent text-accent-foreground">
              -{discountPercent}%
            </span>
          )}

          <div className="absolute top-3 right-3">
            <FavoriteButton productId={id} className="bg-card/80 backdrop-blur-sm" />
          </div>
        </div>

        {/* Info */}
        {category && (
          <p className="text-[11px] tracking-[0.10em] uppercase font-sans font-semibold text-accent mb-1">
            {category}
          </p>
        )}
        <p className="font-serif text-[15px] font-medium text-foreground">{name}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          {hasDiscount && (
            <span className="text-xs font-sans text-muted-foreground line-through">
              R$ {originalPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="text-lg font-sans font-bold text-primary">
            R$ {price.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const ProductCardSkeleton = () => (
  <div>
    <Skeleton className="aspect-[3/4] rounded-xl mb-3" />
    <Skeleton className="h-3 w-16 mb-2" />
    <Skeleton className="h-4 w-32 mb-1" />
    <Skeleton className="h-5 w-20" />
  </div>
);

export default ProductCard;
