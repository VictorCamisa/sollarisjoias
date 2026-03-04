import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import FavoriteButton from "@/components/store/FavoriteButton";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  index?: number;
}

const ProductCard = ({ id, name, price, image, category, index = 0 }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/produto/${id}`} className="group block relative">
        <div className="aspect-[3/4] rounded-2xl bg-secondary overflow-hidden mb-3 relative">
          {image ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-secondary group-hover:scale-105 transition-transform duration-500" />
          )}
          <div className="absolute top-2 right-2">
            <FavoriteButton productId={id} className="bg-card/80 backdrop-blur-sm" />
          </div>
        </div>
        {category && (
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1 font-sans">
            {category}
          </p>
        )}
        <p className="font-medium text-sm">{name}</p>
        <p className="text-muted-foreground text-sm">
          R$ {price.toFixed(2).replace(".", ",")}
        </p>
      </Link>
    </motion.div>
  );
};

export const ProductCardSkeleton = () => (
  <div>
    <Skeleton className="aspect-[3/4] rounded-2xl mb-3" />
    <Skeleton className="h-3 w-16 mb-2" />
    <Skeleton className="h-4 w-32 mb-1" />
    <Skeleton className="h-4 w-20" />
  </div>
);

export default ProductCard;
