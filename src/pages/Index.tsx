import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/store/ProductCard";
import { useProducts, useCategories } from "@/hooks/useStore";

const Index = () => {
  const { data: featured, isLoading: loadingFeatured } = useProducts(undefined, true);
  const { data: categories } = useCategories();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-secondary via-background to-background">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-larifa-sky blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-larifa-sky blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-6 max-w-2xl"
        >
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4 font-sans font-medium">
            Nova Coleção 2026
          </p>
          <h1 className="text-5xl md:text-7xl font-serif font-semibold leading-tight mb-6">
            Elegância em cada detalhe
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto mb-10 font-light">
            Descubra peças exclusivas feitas para quem valoriza estilo e sofisticação.
          </p>
          <Link to="/produtos">
            <Button className="rounded-xl h-12 px-8 text-sm font-semibold tracking-wide gap-2">
              Ver Coleção <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3 font-sans font-medium">
              Explore
            </p>
            <h2 className="text-3xl font-serif font-semibold">Categorias</h2>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/produtos?categoria=${cat.slug}`}>
                <Button variant="outline" className="rounded-xl font-sans text-sm tracking-wide">
                  {cat.name}
                </Button>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3 font-sans font-medium">
            Curadoria
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold">Destaques</h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {loadingFeatured
            ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured && featured.length > 0
              ? featured.slice(0, 6).map((p, i) => (
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
                <div className="col-span-full text-center text-muted-foreground py-12">
                  <p className="text-sm">Nenhum produto em destaque ainda.</p>
                  <p className="text-xs mt-1">Adicione produtos pelo painel admin.</p>
                </div>
              )}
        </div>
      </section>
    </>
  );
};

export default Index;
