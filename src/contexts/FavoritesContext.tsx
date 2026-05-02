import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface FavoritesContextType {
  favorites: Set<string>;
  count: number;
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string, productName?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    setLoading(true);
    const { data } = await (supabase.from("customer_favorites") as any)
      .select("product_id")
      .eq("user_id", user.id);
    setFavorites(new Set((data ?? []).map((r: any) => r.product_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: string, productName?: string) => {
      if (!user) {
        toast.error("Crie uma conta para salvar favoritos", {
          action: { label: "Entrar", onClick: () => (window.location.href = "/auth") },
        });
        return;
      }
      const isFav = favorites.has(productId);
      // optimistic
      const next = new Set(favorites);
      if (isFav) next.delete(productId);
      else next.add(productId);
      setFavorites(next);

      if (isFav) {
        const { error } = await (supabase.from("customer_favorites") as any)
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) {
          setFavorites(favorites);
          toast.error("Não foi possível remover");
        }
      } else {
        const { error } = await (supabase.from("customer_favorites") as any).insert({
          user_id: user.id,
          product_id: productId,
        });
        if (error) {
          setFavorites(favorites);
          toast.error("Não foi possível favoritar");
        } else {
          toast.success(productName ? `${productName} salvo nos favoritos ✨` : "Salvo nos favoritos ✨");
        }
      }
    },
    [favorites, user]
  );

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  return (
    <FavoritesContext.Provider
      value={{ favorites, count: favorites.size, loading, isFavorite, toggle, refresh }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
