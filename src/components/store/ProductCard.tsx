import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, Eye } from "lucide-react";
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

  const allImages = images && images.length > 1 ? images : image ? [image] : [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hoverTimer, setHoverTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (allImages.length <= 1) return;
    // Immediately show next image
    setCurrentIdx((prev) => (prev + 1) % allImages.length);
    // Then rotate every 7 seconds
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % allImages.length);
    }, 7000);
    setHoverTimer(timer);
  }, [allImages.length]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer) clearInterval(hoverTimer);
    setHoverTimer(null);
    setCurrentIdx(0); // Reset to first image
  }, [hoverTimer]);

  const currentImage = allImages[currentIdx] || image;
  const nextImage = allImages.length > 1 ? allImages[(currentIdx + 1) % allImages.length] : null;

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
        {/* Image container */}
        <div className="aspect-[3/4] overflow-hidden relative bg-secondary border border-border/30">
          {/* Main image with crossfade */}
          <AnimatePresence mode="wait">
            {currentImage ? (
              <motion.img
                key={currentImage}
                src={currentImage}
                alt={name}
                loading="lazy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="w-full h-full object-cover absolute inset-0 group-hover:scale-[1.03] transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-secondary" />
            )}
          </AnimatePresence>

          {/* Bottom gradient overlay - always visible, stronger on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30,15%,8%,0.45)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Hover overlay content */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 z-10">
            <div className="flex items-center justify-center gap-2">
              <span className="bg-card/95 backdrop-blur-sm text-foreground text-[10px] sm:text-[11px] font-semibold tracking-[0.06em] uppercase px-4 py-2 flex items-center gap-1.5 shadow-lg">
                <Eye className="h-3 w-3" />
                Ver Detalhes
              </span>
            </div>
          </div>

          {/* Dots indicator - only on hover when multiple images */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              {allImages.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-[3px] rounded-full transition-all duration-500",
                    i === currentIdx ? "bg-white w-4" : "bg-white/40 w-[3px]"
                  )}
                />
              ))}
            </div>
          )}

          {/* Badge */}
          {badge && (
            <span className={cn(
              "absolute top-2.5 left-2.5 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider z-10",
              badge === "Novo" ? "bg-accent text-accent-foreground" :
              badge === "Esgotado" ? "bg-muted-foreground text-card" :
              "bg-accent text-accent-foreground"
            )}>
              {badge}
            </span>
          )}

          {hasDiscount && !badge && (
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground z-10">
              -{discountPercent}%
            </span>
          )}

          {/* Favorite button */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton productId={id} className="bg-card/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        {/* Product info - richer card */}
        <div className="pt-3 sm:pt-3.5 pb-1">
          {category && (
            <p className="text-[9px] sm:text-[10px] tracking-[0.12em] uppercase text-accent font-semibold mb-1">
              {category}
            </p>
          )}
          <p className="font-serif text-[14px] sm:text-[16px] text-foreground leading-snug line-clamp-2 mb-1.5">
            {name}
          </p>
          <div className="flex items-baseline gap-2.5">
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] text-muted-foreground line-through">
                R$ {originalPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
            <span className="text-[13px] sm:text-[14px] font-semibold text-foreground">
              R$ {price.toFixed(2).replace(".", ",")}
            </span>
          </div>
          {/* Installment hint */}
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
            ou 3x de R$ {(price / 3).toFixed(2).replace(".", ",")}
          </p>
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
    <Skeleton className="h-2.5 w-24 mt-1" />
  </div>
);

export default ProductCard;