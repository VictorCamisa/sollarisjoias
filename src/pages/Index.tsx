import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/store/ProductCard";
import NewsletterForm from "@/components/store/NewsletterForm";
import { useProducts, useCategories } from "@/hooks/useStore";
import SEOHead from "@/components/seo/SEOHead";

// Banners
import bannerHero from "@/assets/banners/banner-hero.jpg";
import bannerLayering from "@/assets/banners/banner-layering.jpg";
import bannerConjuntos from "@/assets/banners/banner-conjuntos.jpg";
import bannerBrincos from "@/assets/banners/banner-brincos.jpg";
import bannerPromocional from "@/assets/banners/banner-promocional.jpg";

/* ─────────────────────────────────────────────────────────────────
   HERO - Editorial Refinado
───────────────────────────────────────────────────────────────── */
const HeroSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="relative h-[85vh] min-h-[500px] max-h-[700px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={bannerHero}
          alt="Larifa — Semijoias Premium"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="container mx-auto px-6 pb-16 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl"
          >
            <p className="text-caption text-white/70 mb-4">Nova Coleção</p>
            <h1 className="text-display md:text-display-lg font-serif text-white mb-6">
              Semijoias que<br />
              <em className="font-light">contam histórias</em>
            </h1>
            <p className="text-white/70 text-base font-light mb-8 max-w-md leading-relaxed">
              Peças atemporais com banho de ouro 18k, feitas para 
              acompanhar você em cada momento especial.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/produtos">
                <Button className="h-11 px-8 text-[13px] tracking-wide font-medium bg-white text-foreground hover:bg-white/90 transition-all">
                  Ver Coleção
                </Button>
              </Link>
              <Link to="/novidades">
                <Button 
                  variant="outline" 
                  className="h-11 px-8 text-[13px] tracking-wide font-medium border-white/40 text-white bg-transparent hover:bg-white/10"
                >
                  Novidades
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   TRUST BAR - Minimalista
───────────────────────────────────────────────────────────────── */
const TrustBar = () => (
  <section className="bg-card border-b border-border">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap text-muted-foreground">
        {["Frete grátis +R$199", "Garantia 6 meses", "Banho 18k", "3x sem juros"].map((item) => (
          <span key={item} className="text-[11px] tracking-wide font-medium uppercase">
            {item}
          </span>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────────
   CATEGORIES - Grid Limpo
───────────────────────────────────────────────────────────────── */
const CategoryGrid = ({ categories }: { categories: { id: string; name: string; slug: string }[] }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-16 md:py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-display-sm font-serif text-foreground">Categorias</h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to={`/produtos?categoria=${cat.slug}`}
                className="inline-block px-6 py-3 border border-border text-sm font-medium text-foreground hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
              >
                {cat.name}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   FEATURED PRODUCTS - Grid Premium
───────────────────────────────────────────────────────────────── */
const FeaturedProducts = ({ products, loading }: { products: any[] | undefined; loading: boolean }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 md:py-20 bg-card">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10"
        >
          <div>
            <p className="text-caption text-muted-foreground mb-2">Curadoria</p>
            <h2 className="text-display-sm font-serif text-foreground">Mais Vendidos</h2>
          </div>
          <Link to="/produtos" className="mt-4 md:mt-0">
            <span className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-2">
              Ver todos <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products && products.length > 0
              ? products.slice(0, 8).map((p, i) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    originalPrice={p.original_price}
                    image={p.foto_frontal || p.images?.[0]}
                    category={(p.categories as any)?.name}
                    index={i}
                  />
                ))
              : (
                <div className="col-span-full text-center text-muted-foreground py-16">
                  <p className="text-sm">Nenhum produto em destaque.</p>
                </div>
              )}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   LAYERING EDITORIAL - Split Elegante
───────────────────────────────────────────────────────────────── */
const LayeringSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[#1a2332]">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="aspect-[4/5] lg:aspect-auto overflow-hidden"
        >
          <img 
            src={bannerLayering} 
            alt="Layering de Colares" 
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center p-10 md:p-16 lg:p-20"
        >
          <div className="max-w-sm">
            <p className="text-caption text-white/50 mb-4">Tendência</p>
            <h2 className="text-display-sm md:text-display font-serif text-white mb-5">
              A Arte do<br />Layering
            </h2>
            <p className="text-white/60 text-base font-light leading-relaxed mb-8">
              Combine colares de diferentes comprimentos para criar composições únicas e sofisticadas.
            </p>
            <Link to="/produtos?categoria=colares">
              <Button className="h-11 px-8 text-[13px] tracking-wide font-medium bg-white text-[#1a2332] hover:bg-white/90">
                Ver Colares
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   EDITORIAL GRID - 2 Cards
───────────────────────────────────────────────────────────────── */
const EditorialGrid = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const cards = [
    {
      image: bannerConjuntos,
      title: "Conjuntos",
      subtitle: "Harmonia perfeita",
      link: "/produtos",
    },
    {
      image: bannerPromocional,
      title: "Presentes",
      subtitle: "Para momentos especiais",
      link: "/produtos?categoria=pulseiras",
    },
  ];

  return (
    <section ref={ref} className="py-16 md:py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={card.link} className="group block relative aspect-[4/3] overflow-hidden">
                <img 
                  src={card.image} 
                  alt={card.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-end p-6 md:p-8">
                  <div>
                    <p className="text-white/70 text-xs tracking-wide uppercase mb-1">{card.subtitle}</p>
                    <h3 className="font-serif text-2xl text-white">{card.title}</h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   EARRINGS BANNER - Wide Strip
───────────────────────────────────────────────────────────────── */
const EarringsBanner = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="bg-secondary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <Link to="/produtos?categoria=brincos" className="group block">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex-shrink-0 text-center md:text-left">
                <p className="text-caption text-muted-foreground mb-1">Coleção</p>
                <h2 className="text-display-sm font-serif text-foreground">Brincos</h2>
              </div>
              <div className="flex-1 overflow-hidden rounded-sm">
                <img 
                  src={bannerBrincos} 
                  alt="Coleção de Brincos" 
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <ArrowRight className="h-5 w-5 text-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   LARI CTA - Assistente
───────────────────────────────────────────────────────────────── */
const LariSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 md:py-20 bg-card border-y border-border">
      <div className="container mx-auto px-6 text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-5 w-5 text-foreground" />
          </div>
          <h2 className="text-display-sm font-serif text-foreground mb-4">
            Precisa de ajuda?
          </h2>
          <p className="text-muted-foreground text-base font-light leading-relaxed mb-8">
            A Lari, nossa assistente virtual, ajuda você a encontrar a peça perfeita.
          </p>
          <Button
            className="h-11 px-8 text-[13px] tracking-wide font-medium"
            onClick={() => {
              const btn = document.querySelector('[data-style-assistant-trigger]') as HTMLButtonElement;
              btn?.click();
            }}
          >
            Falar com a Lari
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   NEWSLETTER - Refinada
───────────────────────────────────────────────────────────────── */
const NewsletterSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 md:py-20 bg-foreground">
      <div className="container mx-auto px-6 text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-display-sm font-serif text-background mb-3">
            Fique por dentro
          </h2>
          <p className="text-background/60 text-sm font-light mb-8">
            Cadastre-se e ganhe 10% OFF na primeira compra.
          </p>
          <NewsletterForm />
        </motion.div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */
const Index = () => {
  const { data: featured, isLoading: loadingFeatured } = useProducts(undefined, true);
  const { data: categories } = useCategories();

  return (
    <>
      <SEOHead />
      <HeroSection />
      <TrustBar />
      {categories && categories.length > 0 && <CategoryGrid categories={categories} />}
      <FeaturedProducts products={featured} loading={loadingFeatured} />
      <LayeringSection />
      <EditorialGrid />
      <EarringsBanner />
      <LariSection />
      <NewsletterSection />
    </>
  );
};

export default Index;
