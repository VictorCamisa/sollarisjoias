import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";

const FavoriteButton = ({ productId, className }: { productId: string; className?: string }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const fav = isFavorite(productId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(productId);
      }}
      className={cn("p-2 rounded-full transition-all", className)}
      title={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart className={cn("h-5 w-5 transition-all", fav ? "fill-accent text-accent" : "text-foreground/60 hover:text-accent")} />
    </button>
  );
};

export default FavoriteButton;
