import { useSearchParams, Link } from "react-router-dom";
import { useProducts, useCategories } from "@/hooks/useStore";
import ProductCard from "@/components/store/ProductCard";
import { cn } from "@/lib/utils";

const CollectionPage = () => {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("categoria") || undefined;

  const { data: products, isLoading } = useProducts(activeCategory);
  const { data: categories } = useCategories();

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Sollaris
        </p>
        <h1 className="font-serif text-display text-foreground">
          Coleção
        </h1>
      </div>

      {/* Category filters */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          <Link
            to="/colecao"
            className={cn(
              "font-sans text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border transition-all duration-300",
              !activeCategory
                ? "border-accent text-accent"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            Todas
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/colecao?categoria=${cat.slug}`}
              className={cn(
                "font-sans text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border transition-all duration-300",
                activeCategory === cat.slug
                  ? "border-accent text-accent"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[3/4] bg-secondary animate-pulse" />
              <div className="h-3 w-2/3 bg-secondary animate-pulse" />
              <div className="h-3 w-1/3 bg-secondary animate-pulse" />
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              originalPrice={product.original_price}
              image={product.foto_frontal || product.images?.[0] || null}
              category={(product.categories as any)?.name}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-sans text-sm text-muted-foreground">
            Nenhuma peça encontrada nesta categoria.
          </p>
        </div>
      )}
    </div>
  );
};

export default CollectionPage;
