import { useProducts } from "@/hooks/useStore";
import { useFavorites } from "@/contexts/FavoritesContext";
import ProductCard from "@/components/store/ProductCard";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const Favorites = () => {
  const { favorites } = useFavorites();
  const { data: allProducts } = useProducts();

  const favProducts = (allProducts || []).filter((p) => favorites.includes(p.id));

  return (
    <div className="pt-24 pb-16 container mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <Heart className="h-8 w-8 text-accent mx-auto mb-3" />
        <h1 className="text-3xl font-serif font-semibold">Meus Favoritos</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {favProducts.length === 0 ? "Você ainda não favoritou nenhuma peça." : `${favProducts.length} peça${favProducts.length > 1 ? "s" : ""} salva${favProducts.length > 1 ? "s" : ""}`}
        </p>
      </motion.div>

      {favProducts.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {favProducts.map((p, i) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              image={p.images?.[0]}
              category={(p.categories as any)?.name}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
