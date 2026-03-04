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
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-secondary">
      {/* Warm gradient blobs using accent (terracotta) */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y }}>
        <motion.div
          className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: "hsl(var(--accent) / 0.12)" }}
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: "hsl(var(--accent) / 0.08)" }}
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-[250px] h-[250px] rounded-full blur-[80px]"
          style={{ background: "hsl(var(--ring) / 0.06)" }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Floating particles - terracotta dots */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent/25"
          style={{
            top: `${20 + i * 14}%`,
            left: `${12 + i * 16}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.15, 0.5, 0.15],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div style={{ opacity, scale }} className="relative z-10 text-center px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-accent/25 bg-accent/8"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs tracking-[0.3em] uppercase text-accent font-medium font-sans">Nova Coleção 2026</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-serif font-semibold leading-[0.95] mb-6 text-foreground"
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
          className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto mb-10 font-light font-sans"
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
            <Button className="rounded-full h-14 px-10 text-sm font-semibold tracking-wide gap-2 group bg-accent text-accent-foreground hover:bg-accent/90">
              Ver Coleção
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/sobre">
            <Button variant="outline" className="rounded-full h-14 px-10 text-sm font-semibold tracking-wide border-foreground/20 hover:border-accent hover:text-accent">
              Conheça a LARIFA
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="h-6 w-6 text-accent/40" />
      </motion.div>
    </section>
  );
};

const MarqueeBanner = () => (
  <section className="py-5 overflow-hidden border-y border-border/50 bg-background">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((word, i) => (
        <span key={i} className="mx-6 text-xl md:text-2xl font-serif font-semibold text-accent/20 select-none">
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
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Link
        to={`/produtos?categoria=${cat.slug}`}
        className="group relative block h-40 md:h-52 rounded-2xl overflow-hidden bg-card border border-border hover:border-accent/40 transition-all duration-500 hover:shadow-lg"
      >
        <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-500" />
        <motion.div
          className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-accent/8"
          whileHover={{ scale: 1.5 }}
          transition={{ duration: 0.6 }}
        />
        <div className="relative z-10 h-full flex flex-col justify-end p-6">
          <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground group-hover:text-accent transition-colors duration-300">
            {cat.name}
          </h3>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground group-hover:text-accent text-sm font-sans transition-colors">
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
      <h2 className="text-3xl md:text-5xl font-serif font-semibold text-foreground">{title}</h2>
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
                  <p className="text-sm font-sans">Nenhum produto em destaque ainda.</p>
                  <p className="text-xs mt-1 font-sans">Adicione produtos pelo painel admin.</p>
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
              <Button variant="outline" className="rounded-full h-12 px-8 text-sm tracking-wide gap-2 group border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground">
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
          className="relative rounded-3xl overflow-hidden py-20 px-8 text-center"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent) / 0.9))" }}
        >
          <motion.div
            className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px]"
            style={{ background: "hsl(var(--accent) / 0.3)" }}
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <div className="relative z-10 max-w-lg mx-auto">
            <Sparkles className="h-8 w-8 mx-auto mb-4 text-primary-foreground/80" />
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4 text-primary-foreground">
              Precisa de ajuda para montar seu look?
            </h2>
            <p className="text-primary-foreground/70 mb-8 text-lg font-light font-sans">
              Nossa assistente IA Lari monta looks personalizados e finaliza seu pedido em minutos.
            </p>
            <Button
              className="rounded-full h-14 px-10 text-sm font-semibold tracking-wide gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
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
