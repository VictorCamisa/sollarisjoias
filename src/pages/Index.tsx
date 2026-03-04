import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/store/ProductCard";
import { useProducts, useCategories } from "@/hooks/useStore";
import SEOHead from "@/components/seo/SEOHead";

import heroImage from "@/assets/hero-editorial.jpg";
import lookbook1 from "@/assets/lookbook-1.jpg";
import lookbook2 from "@/assets/lookbook-2.jpg";
import lifestyleImg from "@/assets/lifestyle-accessories.jpg";

/* ─── Hero: full-bleed editorial image ─── */
const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] overflow-hidden">
      {/* Parallax image */}
      <motion.div className="absolute inset-0" style={{ y }}>
        <img
          src={heroImage}
          alt="LARIFA - Elegância em cada detalhe"
          className="w-full h-[115%] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
      </motion.div>

      {/* Content pinned to bottom-left — editorial style */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 flex items-end z-10"
      >
        <div className="w-full px-6 md:px-16 pb-16 md:pb-24">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xs md:text-sm tracking-[0.4em] uppercase text-primary-foreground/70 font-sans mb-4"
          >
            Nova Coleção 2026
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-4xl md:text-7xl lg:text-8xl font-serif font-semibold text-primary-foreground leading-[0.95] max-w-2xl"
          >
            Elegância<br />
            <span className="italic text-accent-foreground">em cada</span><br />
            detalhe
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-8 flex gap-4"
          >
            <Link to="/produtos">
              <Button className="rounded-none h-12 md:h-14 px-8 md:px-12 text-xs md:text-sm tracking-[0.2em] uppercase font-sans font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-colors">
                Ver Coleção
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

/* ─── Editorial split: lookbook grid ─── */
const LookbookSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">
      {/* Left: image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
        className="relative overflow-hidden"
      >
        <motion.img
          src={lookbook1}
          alt="Lookbook LARIFA"
          className="w-full h-full object-cover min-h-[50vh]"
          initial={{ scale: 1.1 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </motion.div>

      {/* Right: text */}
      <div className="flex items-center justify-center bg-secondary px-8 md:px-16 py-16 md:py-0">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-md"
        >
          <p className="text-xs tracking-[0.4em] uppercase text-accent font-sans font-medium mb-6">Lookbook</p>
          <h2 className="text-3xl md:text-5xl font-serif font-semibold text-foreground leading-tight mb-6">
            Peças que contam a sua história
          </h2>
          <p className="text-muted-foreground font-sans font-light text-base md:text-lg leading-relaxed mb-8">
            Cada peça da LARIFA é escolhida com cuidado, pensando em quem valoriza
            autenticidade e estilo sem esforço.
          </p>
          <Link to="/produtos">
            <button className="group inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase font-sans font-medium text-foreground border-b-2 border-foreground pb-1 hover:border-accent hover:text-accent transition-colors duration-300">
              Explorar peças
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Category strip ─── */
const CategoryStrip = ({ categories }: { categories: { id: string; name: string; slug: string }[] }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-accent font-sans font-medium mb-3">Explore</p>
            <h2 className="text-3xl md:text-5xl font-serif font-semibold text-foreground">Categorias</h2>
          </div>
          <Link to="/produtos" className="mt-4 md:mt-0">
            <span className="text-sm font-sans text-muted-foreground hover:text-accent transition-colors underline underline-offset-4">
              Ver tudo →
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                to={`/produtos?categoria=${cat.slug}`}
                className="group block border border-border hover:border-accent/50 rounded-none p-6 md:p-8 transition-all duration-500 hover:bg-accent/5"
              >
                <h3 className="font-serif text-lg md:text-xl text-foreground group-hover:text-accent transition-colors duration-300">
                  {cat.name}
                </h3>
                <ArrowRight className="h-4 w-4 mt-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Featured products ─── */
const FeaturedSection = ({ products, loading }: { products: any[] | undefined; loading: boolean }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-6 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-accent font-sans font-medium mb-3">Curadoria</p>
            <h2 className="text-3xl md:text-5xl font-serif font-semibold text-foreground">Destaques</h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products && products.length > 0
              ? products.slice(0, 6).map((p, i) => (
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
                <div className="col-span-full text-center text-muted-foreground py-16">
                  <p className="text-sm font-sans">Nenhum produto em destaque ainda.</p>
                  <p className="text-xs mt-1 font-sans">Adicione produtos pelo painel admin.</p>
                </div>
              )}
        </div>

        {products && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <Link to="/produtos">
              <button className="group inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase font-sans font-medium text-foreground border-b-2 border-foreground pb-1 hover:border-accent hover:text-accent transition-colors duration-300">
                Ver toda coleção
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

/* ─── Editorial split: lifestyle + CTA Lari ─── */
const LifestyleSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
      {/* Left: text + CTA */}
      <div className="flex items-center justify-center bg-foreground px-8 md:px-16 py-16 md:py-0 order-2 md:order-1">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md"
        >
          <Sparkles className="h-6 w-6 text-accent mb-6" />
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-primary-foreground leading-tight mb-6">
            Precisa de ajuda para montar seu look?
          </h2>
          <p className="text-primary-foreground/60 font-sans font-light text-base leading-relaxed mb-8">
            Nossa assistente IA Lari monta looks personalizados, encontra peças
            e finaliza seu pedido em minutos — tudo por aqui.
          </p>
          <Button
            className="rounded-none h-12 px-8 text-xs tracking-[0.2em] uppercase font-sans font-medium bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => {
              const btn = document.querySelector('[data-style-assistant-trigger]') as HTMLButtonElement;
              btn?.click();
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" /> Falar com a Lari
          </Button>
        </motion.div>
      </div>

      {/* Right: image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
        className="relative overflow-hidden order-1 md:order-2"
      >
        <motion.img
          src={lifestyleImg}
          alt="Acessórios LARIFA"
          className="w-full h-full object-cover min-h-[50vh]"
          initial={{ scale: 1.1 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </motion.div>
    </section>
  );
};

/* ─── Editorial banner with second lookbook image ─── */
const EditorialBanner = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative h-[60vh] md:h-[70vh] overflow-hidden">
      <motion.img
        src={lookbook2}
        alt="Detalhes LARIFA"
        className="w-full h-full object-cover"
        initial={{ scale: 1.15 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/50 to-transparent" />
      <motion.div
        className="absolute inset-0 flex items-center px-6 md:px-16 z-10"
        initial={{ opacity: 0, x: -30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="max-w-lg">
          <p className="text-xs tracking-[0.4em] uppercase text-primary-foreground/60 font-sans mb-4">Nosso DNA</p>
          <h2 className="text-3xl md:text-5xl font-serif font-semibold text-primary-foreground leading-tight mb-6">
            Cada detalhe importa
          </h2>
          <Link to="/sobre">
            <button className="group inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase font-sans font-medium text-primary-foreground border-b border-primary-foreground/50 pb-1 hover:border-accent hover:text-accent transition-colors duration-300">
              Conheça a LARIFA
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

/* ─── Main ─── */
const Index = () => {
  const { data: featured, isLoading: loadingFeatured } = useProducts(undefined, true);
  const { data: categories } = useCategories();

  return (
    <>
      <SEOHead />
      <HeroSection />
      <LookbookSection />
      {categories && categories.length > 0 && <CategoryStrip categories={categories} />}
      <FeaturedSection products={featured} loading={loadingFeatured} />
      <EditorialBanner />
      <LifestyleSection />
    </>
  );
};

export default Index;
