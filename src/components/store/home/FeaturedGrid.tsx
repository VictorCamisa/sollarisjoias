import { Link } from "react-router-dom";
import { useFeaturedProducts, useProducts } from "@/hooks/useStore";
import ProductCard from "@/components/store/ProductCard";
import { ArrowRight } from "lucide-react";

interface FeaturedGridProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** se true, usa featured; senão, todos os produtos */
  featuredOnly?: boolean;
  limit?: number;
  showSeeAll?: boolean;
}

const FeaturedGrid = ({
  eyebrow = "Selecionadas para você",
  title = "Mais desejadas",
  subtitle,
  featuredOnly = true,
  limit = 8,
  showSeeAll = true,
}: FeaturedGridProps) => {
  const featured = useFeaturedProducts();
  const all = useProducts();

  const source = featuredOnly ? featured : all;
  const products = (source.data ?? []).slice(0, limit);

  if (source.isLoading) {
    return (
      <section className="bg-background py-16 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-muted mb-4" />
                <div className="h-3 w-1/3 bg-muted mb-2" />
                <div className="h-4 w-3/4 bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-10 sm:mb-14">
          <div>
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bordeaux mb-3">
                {eyebrow}
              </p>
            )}
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="font-sans text-foreground/65 mt-3 max-w-md">{subtitle}</p>
            )}
          </div>
          {showSeeAll && (
            <Link
              to="/colecao"
              className="hidden sm:inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/70 hover:text-bordeaux transition-colors group whitespace-nowrap"
            >
              Ver toda a coleção
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.6} />
            </Link>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 sm:gap-x-6 gap-y-12 sm:gap-y-16">
          {products.map((product: any) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={Number(product.price)}
              originalPrice={product.original_price ? Number(product.original_price) : null}
              image={product.images?.[0] ?? product.foto_frontal ?? null}
              category={product.categories?.name}
              stockQuantity={product.stock_quantity}
              createdAt={product.created_at}
            />
          ))}
        </div>

        {showSeeAll && (
          <div className="sm:hidden mt-10 text-center">
            <Link
              to="/colecao"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-bordeaux border-b border-bordeaux/40 pb-1"
            >
              Ver toda a coleção <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedGrid;
