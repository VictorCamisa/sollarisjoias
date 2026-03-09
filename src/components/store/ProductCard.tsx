import { useState, useEffect, useCallback } from "react";
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
  images?: string[];
  category?: string;
  index?: number;
  badge?: string;
}

const ProductCard = ({ id, name, price, originalPrice, image, images, category, index = 0, badge }: ProductCardProps) => {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Auto-rotate images
  const allImages = images && images.length > 1 ? images : image ? [image] : [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (allImages.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % allImages.length);
    }, 3500 + index * 300); // stagger intervals
    return () => clearInterval(interval);
  }, [allImages.length, isHovered, index]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (allImages.length > 1) {
      setCurrentIdx((prev) => (prev + 1) % allImages.length);
    }
  }, [allImages.length]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const currentImage = allImages[currentIdx] || image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <Link
        to={`/produto/${id}`}
        className="group block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image */}
        <div className="aspect-[3/4] overflow-hidden mb-3 relative bg-secondary">
          {currentImage ? (
            <img
              src={currentImage}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-700"
            />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}

          {/* Dots indicator */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === currentIdx ? "bg-foreground/80 w-3" : "bg-foreground/30"
                  )}
                />
              ))}
            </div>
          )}

          {/* Badge */}
          {badge && (
            <span className={cn(
              "absolute top-2 left-2 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide",
              badge === "Novo" ? "bg-foreground text-background" : 
              badge === "Esgotado" ? "bg-muted-foreground text-background" : 
              "bg-foreground text-background"
            )}>
              {badge}
            </span>
          )}

          {hasDiscount && !badge && (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide bg-foreground text-background">
              -{discountPercent}%
            </span>
          )}

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FavoriteButton productId={id} className="bg-card/90 backdrop-blur-sm" />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-0.5 sm:space-y-1">
          {category && (
            <p className="text-[9px] sm:text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
              {category}
            </p>
          )}
          <p className="font-serif text-[13px] sm:text-[15px] text-foreground leading-snug line-clamp-2">{name}</p>
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                R$ {originalPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
            <span className="text-xs sm:text-sm font-medium text-foreground">
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