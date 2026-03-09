import { useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard, { ProductCardSkeleton } from "@/components/store/ProductCard";
import { useProducts, useCategories } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";

const NEW_PRODUCTS_DAYS = 30;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const isNovidadesPage = pathname === "/novidades";
  const activeCategory = searchParams.get("categoria") || undefined;

  const { data: products, isLoading } = useProducts(activeCategory);
  const { data: categories } = useCategories();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!isNovidadesPage) return products;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NEW_PRODUCTS_DAYS);

    return products.filter((p) => new Date(p.created_at) >= cutoff);
  }, [products, isNovidadesPage]);

  return (
    <div className="pt-20 sm:pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold mb-3 sm:mb-4">
            {isNovidadesPage ? "Novidades" : "Coleção"}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            {isNovidadesPage
              ? `Peças adicionadas nos últimos ${NEW_PRODUCTS_DAYS} dias.`
              : "Explore todas as peças da LARIFA."}
          </p>
        </motion.div>

        {/* Category filters */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10 px-1">
            <Button
              variant={!activeCategory ? "default" : "outline"}
              size="sm"
              className="rounded-none text-xs tracking-wide"
              onClick={() => setSearchParams({})}
            >
              Todas
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.slug ? "default" : "outline"}
                size="sm"
                className="rounded-none text-xs tracking-wide"
                onClick={() => setSearchParams({ categoria: cat.slug })}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : filteredProducts.length > 0
              ? filteredProducts.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    image={p.foto_frontal || p.images?.[0]}
                    images={[p.foto_frontal, p.foto_lateral, p.foto_detalhe].filter(Boolean) as string[]}
                    category={(p.categories as any)?.name}
                    index={i}
                  />
                ))
              : (
                <div className="col-span-full text-center text-muted-foreground py-20">
                  <p>
                    {isNovidadesPage
                      ? "Nenhuma novidade encontrada no período."
                      : "Nenhum produto encontrado."}
                  </p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default Products;