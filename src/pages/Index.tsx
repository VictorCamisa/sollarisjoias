import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/store/ProductCard";
import { useProducts, useCategories } from "@/hooks/useStore";
import SEOHead from "@/components/seo/SEOHead";

const marqueeWords = ["ESTILO", "✦", "ELEGÂNCIA", "✦", "ATITUDE", "✦", "MODA", "✦", "TENDÊNCIA", "✦"];

const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.7], [1, 0.9]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated gradient blobs */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y }}>
        <motion.div
          className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[100px]"
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[80px]"
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-ring/5 blur-[60px]"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Floating particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-accent/30"
          style={{
            top: `${15 + i * 14}%`,
            left: `${10 + i * 15}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div style={{ opacity, scale }} className="relative z-10 text-center px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs tracking-[0.3em] uppercase text-accent font-medium">Nova Coleção 2026</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-serif font-semibold leading-[0.95] mb-6"
        >
          <span className="block">Elegância</span>
          <motion.span
            className="block text-accent italic"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            em cada
          </motion.span>
          <span className="block">detalhe</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto mb-10 font-light"
        >
          Descubra peças exclusivas feitas para quem valoriza estilo e sofisticação.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/produtos">
            <Button className="rounded-full h-14 px-10 text-sm font-semibold tracking-wide gap-2 group">
              Ver Coleção
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/sobre">
            <Button variant="outline" className="rounded-full h-14 px-10 text-sm font-semibold tracking-wide">
              Conheça a LARIFA
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="h-6 w-6 text-muted-foreground/50" />
      </motion.div>
    </section>
  );
};

const MarqueeBanner = () => (
  <section className="py-6 overflow-hidden border-y border-border bg-secondary/50">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((word, i) => (
        <span key={i} className="mx-6 text-2xl md:text-3xl font-serif font-semibold text-foreground/10 select-none">
          {word}
        </span>
      ))}
    </div>
  </section>
);

const CategoryCard = ({ cat, index }: { cat: { id: string; name: string; slug: string }; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Link
        to={`/produtos?categoria=${cat.slug}`}
        className="group relative block h-40 md:h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-secondary to-muted border border-border hover:border-accent/30 transition-all duration-500"
      >
        <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-500" />
        <motion.div
          className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-accent/10 blur-2xl"
          whileHover={{ scale: 1.5 }}
          transition={{ duration: 0.6 }}
        />
        <div className="relative z-10 h-full flex flex-col justify-end p-6">
          <h3 className="font-serif text-xl md:text-2xl font-semibold group-hover:text-accent transition-colors duration-300">
            {cat.name}
          </h3>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground group-hover:text-accent text-sm transition-colors">
            <span>Explorar</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const SectionHeader = ({ label, title }: { label: string; title: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center mb-12"
    >
      <motion.p
        initial={{ opacity: 0, letterSpacing: "0.2em" }}
        animate={inView ? { opacity: 1, letterSpacing: "0.4em" } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-xs uppercase text-accent mb-3 font-sans font-medium"
      >
        {label}
      </motion.p>
      <h2 className="text-3xl md:text-5xl font-serif font-semibold">{title}</h2>
    </motion.div>
  );
};

const Index = () => {
  const { data: featured, isLoading: loadingFeatured } = useProducts(undefined, true);
  const { data: categories } = useCategories();

  return (
    <>
      <SEOHead />
      <HeroSection />
      <MarqueeBanner />

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-6 py-20">
          <SectionHeader label="Explore" title="Categorias" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container mx-auto px-6 py-20">
        <SectionHeader label="Curadoria" title="Destaques" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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

        {featured && featured.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <Link to="/produtos">
              <Button variant="outline" className="rounded-full h-12 px-8 text-sm tracking-wide gap-2 group border-foreground/20 hover:border-accent hover:text-accent">
                Ver toda coleção
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="mx-6 mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-foreground to-foreground/90 text-background py-20 px-8 text-center"
        >
          <motion.div
            className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/20 blur-[100px]"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <div className="relative z-10 max-w-lg mx-auto">
            <Sparkles className="h-8 w-8 mx-auto mb-4 text-accent" />
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">
              Precisa de ajuda para montar seu look?
            </h2>
            <p className="text-background/70 mb-8 text-lg font-light">
              Nossa assistente IA Lari monta looks personalizados e finaliza seu pedido em minutos.
            </p>
            <Button
              variant="outline"
              className="rounded-full h-14 px-10 text-sm font-semibold tracking-wide border-background/30 text-background hover:bg-background hover:text-foreground gap-2"
              onClick={() => {
                const btn = document.querySelector('[data-style-assistant-trigger]') as HTMLButtonElement;
                btn?.click();
              }}
            >
              <Sparkles className="h-4 w-4" /> Falar com a Lari
            </Button>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default Index;
