import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard, { ProductCardSkeleton } from "@/components/store/ProductCard";
import { useProducts, useCategories } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("categoria") || undefined;
  const { data: products, isLoading } = useProducts(activeCategory);
  const { data: categories } = useCategories();

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Coleção</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Explore todas as peças da LARIFA.
          </p>
        </motion.div>

        {/* Category filters */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <Button
              variant={!activeCategory ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-xs tracking-wide"
              onClick={() => setSearchParams({})}
            >
              Todas
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.slug ? "default" : "outline"}
                size="sm"
                className="rounded-xl text-xs tracking-wide"
                onClick={() => setSearchParams({ categoria: cat.slug })}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products && products.length > 0
              ? products.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    image={p.images?.[0]}
                    category={(p.categories as any)?.name}
                    index={i}
                  />
                ))
              : (
                <div className="col-span-full text-center text-muted-foreground py-20">
                  <p>Nenhum produto encontrado.</p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default Products;
