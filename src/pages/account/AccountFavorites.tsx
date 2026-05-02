import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/contexts/FavoritesContext";
import ProductCard from "@/components/store/ProductCard";
import { Heart } from "lucide-react";

const AccountFavorites = () => {
  const { favorites } = useFavorites();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const ids = Array.from(favorites);
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("id, name, price, original_price, foto_frontal, images, category_id, stock_quantity, created_at, categories(name)")
        .in("id", ids);
      setProducts(data ?? []);
      setLoading(false);
    };
    void load();
  }, [favorites]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl text-foreground mb-1">Meus favoritos</h2>
        <p className="font-sans text-sm text-foreground/60">
          {favorites.size === 0 ? "Você ainda não salvou nada" : `${favorites.size} ${favorites.size === 1 ? "peça salva" : "peças salvas"}`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
          ))}
        </div>
      ) : favorites.size === 0 ? (
        <div className="border border-border bg-background py-20 text-center">
          <Heart className="h-10 w-10 mx-auto text-foreground/30 mb-4" strokeWidth={1.2} />
          <p className="font-display text-lg text-foreground mb-2">Sua wishlist está vazia</p>
          <p className="font-sans text-sm text-foreground/60 mb-6">
            Toque no coração das peças que você ama para guardá-las aqui.
          </p>
          <Link
            to="/colecao"
            className="inline-flex items-center gap-2 bg-bordeaux text-maison-creme font-mono text-[11px] uppercase tracking-[0.22em] px-6 py-3 hover:bg-maison-bordeaux-deep transition-colors"
          >
            Explorar coleção →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={Number(p.price)}
              originalPrice={p.original_price ? Number(p.original_price) : null}
              image={p.foto_frontal || p.images?.[0] || null}
              category={p.categories?.name}
              stockQuantity={p.stock_quantity}
              createdAt={p.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountFavorites;
