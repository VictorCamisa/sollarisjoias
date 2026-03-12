import { Link } from "react-router-dom";
import { useFeaturedProducts, useCategories } from "@/hooks/useStore";
import ProductCard from "@/components/store/ProductCard";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HomePage = () => {
  const { data: featured, isLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();

  return (
    <div>
      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-[85vh] px-6 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-background/75" />

        <div className="text-center max-w-2xl mx-auto relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-6"
          >
            Semijoias Premium
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-display-lg md:text-[4.5rem] leading-[1.05] text-foreground mb-6"
          >
            Curadoria com{" "}
            <span className="text-accent">intenção</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-sans text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-10"
          >
            Cada peça existe em nosso portfólio porque foi escolhida sob
            um rigoroso olhar editorial. Exclusividade sem excessos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase text-accent hover:text-foreground transition-colors duration-300 group"
            >
              Explorar Coleção
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Gold separator */}
      <div className="gold-line max-w-[200px] mx-auto" />

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 py-20">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-center mb-10">
            Categorias
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/colecao?categoria=${cat.slug}`}
                className="font-sans text-[11px] tracking-[0.18em] uppercase px-6 py-3 border border-border text-muted-foreground hover:text-accent hover:border-accent transition-all duration-300"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              Seleção
            </p>
            <h2 className="font-serif text-display-sm text-foreground">
              Destaques
            </h2>
          </div>
          <Link
            to="/colecao"
            className="font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors duration-300 hidden md:flex items-center gap-2 group"
          >
            Ver tudo
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] bg-secondary animate-pulse" />
                <div className="h-3 w-2/3 bg-secondary animate-pulse" />
                <div className="h-3 w-1/3 bg-secondary animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {featured?.map((product) => (
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
        )}

        <div className="md:hidden mt-10 text-center">
          <Link
            to="/colecao"
            className="font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-2"
          >
            Ver coleção completa
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* Brand statement */}
      <section className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="gold-line w-12 mx-auto mb-10" />
          <blockquote className="font-serif text-display-sm text-foreground leading-snug mb-6">
            Refinamento que atravessa o tempo.
          </blockquote>
          <p className="font-sans text-xs text-muted-foreground tracking-[0.15em] uppercase">
            Sollaris · Alta Joalheria
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
