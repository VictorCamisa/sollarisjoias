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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <Link to={`/produto/${id}`} className="group block">
        {/* Image */}
        <div className="aspect-[3/4] overflow-hidden mb-3 relative bg-secondary">
          {image ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}

          {/* Badge */}
          {badge && (
            <span className={cn(
              "absolute top-3 left-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              badge === "Novo" ? "bg-foreground text-background" : 
              badge === "Esgotado" ? "bg-muted-foreground text-background" : 
              "bg-foreground text-background"
            )}>
              {badge}
            </span>
          )}

          {hasDiscount && !badge && (
            <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide bg-foreground text-background">
              -{discountPercent}%
            </span>
          )}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FavoriteButton productId={id} className="bg-card/90 backdrop-blur-sm" />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1">
          {category && (
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
              {category}
            </p>
          )}
          <p className="font-serif text-[15px] text-foreground leading-snug">{name}</p>
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                R$ {originalPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
            <span className="text-sm font-medium text-foreground">
              R$ {price.toFixed(2).replace(".", ",")}
            </span>
          </div>
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
    <Skeleton className="aspect-[3/4] mb-3" />
    <Skeleton className="h-2.5 w-14 mb-2" />
    <Skeleton className="h-4 w-28 mb-1.5" />
    <Skeleton className="h-3.5 w-20" />
  </div>
);

export default ProductCard;
