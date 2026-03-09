import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/store/ProductCard";
import NewsletterForm from "@/components/store/NewsletterForm";
import { useProducts, useCategories } from "@/hooks/useStore";
import SEOHead from "@/components/seo/SEOHead";
import { BotanicalDivider, CornerLeaves, BotanicalPattern } from "@/components/store/BotanicalElements";

// Banners
import bannerHero from "@/assets/banners/banner-hero.jpg";
import bannerLayering from "@/assets/banners/banner-layering.jpg";
import bannerConjuntos from "@/assets/banners/banner-conjuntos.jpg";
import bannerBrincos from "@/assets/banners/banner-brincos.jpg";
import bannerPromocional from "@/assets/banners/banner-promocional.jpg";

// Category images
import catAneis from "@/assets/categories/aneis.jpg";
import catBrincos from "@/assets/categories/brincos.jpg";
import catColares from "@/assets/categories/colares.jpg";
import catConjuntos from "@/assets/categories/conjuntos.jpg";
import catPiercings from "@/assets/categories/piercings.jpg";
import catPulseiras from "@/assets/categories/pulseiras.jpg";

const categoryImages: Record<string, string> = {
  aneis: catAneis,
  brincos: catBrincos,
  colares: catColares,
  conjuntos: catConjuntos,
  piercings: catPiercings,
  pulseiras: catPulseiras,
};

/* ═══════════════════════════════════════════════════════════════
   HERO — parallax + teal overlay + botanical corner
═══════════════════════════════════════════════════════════════ */
const HeroSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section ref={ref} className="relative h-[92vh] min-h-[550px] max-h-[850px] overflow-hidden">
      {/* Parallax BG */}
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: bgY }}>
        <img
          src={bannerHero}
          alt="Larifa — Semijoias Premium"
          className="w-full h-[120%] object-cover"
        />
        {/* Teal-tinted overlay instead of pure black */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(172,55%,8%,0.65)] via-[hsl(172,40%,12%,0.25)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(172,55%,8%,0.50)] via-transparent to-[hsl(172,40%,12%,0.10)]" />
      </motion.div>

      {/* Botanical corner decoration */}
      <CornerLeaves position="top-right" opacity={0.12} className="text-white" />
      <CornerLeaves position="bottom-left" opacity={0.08} className="text-white" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-8 md:px-12">
          <motion.div style={{ y: textY }} className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            >
              <p className="text-[12px] tracking-[0.25em] uppercase font-medium text-white/70 mb-5">
                Nova Coleção
              </p>
              <h1 className="text-[46px] md:text-[62px] lg:text-[72px] font-serif text-white leading-[1.02] mb-6">
                Semijoias que<br />
                <em className="font-light italic">contam histórias</em>
              </h1>
              <p className="text-white/55 text-[16px] font-light mb-10 max-w-sm leading-relaxed">
                Peças atemporais com banho de ouro 18k,
                feitas para cada momento especial.
              </p>
              <div className="flex gap-4">
                <Link to="/produtos">
                  <Button className="h-12 px-10 text-[13px] tracking-[0.05em] uppercase font-medium bg-white text-foreground hover:bg-white/90 rounded-none transition-all">
                    Ver Coleção
                  </Button>
                </Link>
                <Link to="/novidades">
                  <Button
                    variant="outline"
                    className="h-12 px-10 text-[13px] tracking-[0.05em] uppercase font-medium border-white/40 text-white bg-transparent hover:bg-white/10 rounded-none"
                  >
                    Novidades
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Organic bottom curve */}
      <div className="absolute bottom-0 left-0 right-0 leading-[0]">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-[40px] md:h-[60px] fill-background">
          <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TRUST BAR — floating overlap
═══════════════════════════════════════════════════════════════ */
const TrustBar = () => (
  <div className="relative z-10 -mt-4 mb-8">
    <div className="container mx-auto px-8 md:px-12">
      <div className="bg-card shadow-lg shadow-foreground/[0.03] rounded-2xl py-5 px-8">
        <div className="flex items-center justify-between gap-4 flex-wrap text-muted-foreground">
          {["Frete grátis acima de R$199", "Garantia de 6 meses", "Banho de ouro 18k", "Até 3x sem juros"].map((item) => (
            <span key={item} className="text-[11px] tracking-[0.1em] uppercase font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES — staggered grid + overlapping labels
═══════════════════════════════════════════════════════════════ */
const CategoryGrid = ({ categories }: { categories: { id: string; name: string; slug: string }[] }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="relative pt-12 pb-0 bg-background overflow-hidden">
      {/* Botanical corner */}
      <CornerLeaves position="top-left" opacity={0.04} className="text-foreground" />

      <div className="container mx-auto px-8 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Explore</p>
          <h2 className="text-[36px] md:text-[42px] font-serif text-foreground">Categorias</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 md:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`${i % 2 === 1 ? "lg:mt-8" : ""}`}
            >
              <Link to={`/produtos?categoria=${cat.slug}`} className="group block relative">
                <div className="aspect-[3/4] overflow-hidden rounded-xl">
                  <img
                    src={categoryImages[cat.slug] || catAneis}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-xl" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-card px-5 py-2 rounded-full shadow-md">
                  <p className="text-[12px] tracking-wide font-medium text-foreground whitespace-nowrap">
                    {cat.name}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="h-16" />
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FEATURED PRODUCTS — soft gradient bg
═══════════════════════════════════════════════════════════════ */
const FeaturedProducts = ({ products, loading }: { products: any[] | undefined; loading: boolean }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background pointer-events-none" />
      <CornerLeaves position="bottom-right" opacity={0.03} className="text-foreground" />

      <div className="relative container mx-auto px-8 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Curadoria</p>
            <h2 className="text-[36px] md:text-[42px] font-serif text-foreground">Mais Vendidos</h2>
          </div>
          <Link to="/produtos" className="mt-4 md:mt-0">
            <span className="text-[13px] font-medium text-foreground inline-flex items-center gap-2 hover:gap-3 transition-all">
              Ver todos <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
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

/* ═══════════════════════════════════════════════════════════════
   LAYERING — teal bg with botanicals + parallax
═══════════════════════════════════════════════════════════════ */
const LayeringSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);

  return (
    <section ref={ref} className="relative">
      <BotanicalDivider bgClass="fill-primary" leafOpacity={0.1} />

      <div className="bg-primary relative overflow-hidden">
        {/* Botanical background pattern */}
        <BotanicalPattern opacity={0.05} className="text-primary-foreground" />
        <CornerLeaves position="top-right" opacity={0.08} className="text-primary-foreground" />

        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[550px] relative z-10">
          <motion.div className="overflow-hidden relative" style={{ y: imgY }}>
            <img
              src={bannerLayering}
              alt="Layering de Colares"
              className="w-full h-[115%] object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center justify-center p-12 md:p-20"
          >
            <div className="max-w-sm">
              <p className="text-[11px] tracking-[0.2em] uppercase text-primary-foreground/40 mb-5">Tendência</p>
              <h2 className="text-[36px] md:text-[52px] font-serif text-primary-foreground leading-[1.08] mb-6">
                A Arte do<br />Layering
              </h2>
              <p className="text-primary-foreground/45 text-[15px] font-light leading-relaxed mb-10">
                Combine colares de diferentes comprimentos e texturas para composições sofisticadas e únicas.
              </p>
              <Link to="/produtos?categoria=colares">
                <Button className="h-12 px-10 text-[13px] tracking-[0.05em] uppercase font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-none">
                  Ver Colares
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <BotanicalDivider flip bgClass="fill-primary" leafOpacity={0.1} />
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   EDITORIAL 2-COL — asymmetric + rounded
═══════════════════════════════════════════════════════════════ */
const EditorialGrid = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const cards = [
    { image: bannerConjuntos, title: "Conjuntos", subtitle: "Harmonia perfeita", link: "/produtos?categoria=conjuntos" },
    { image: bannerPromocional, title: "Presentes", subtitle: "Para momentos especiais", link: "/produtos?categoria=pulseiras" },
  ];

  return (
    <section ref={ref} className="bg-background py-20 md:py-28 relative overflow-hidden">
      <CornerLeaves position="top-right" opacity={0.03} className="text-foreground" />

      <div className="container mx-auto px-8 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`${i === 1 ? "md:mt-12" : ""}`}
            >
              <Link to={card.link} className="group block relative overflow-hidden rounded-2xl">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(172,55%,8%,0.55)] via-black/10 to-transparent rounded-2xl" />
                <div className="absolute inset-0 flex items-end p-8 md:p-10">
                  <div>
                    <p className="text-white/55 text-[11px] tracking-[0.15em] uppercase mb-2">{card.subtitle}</p>
                    <h3 className="font-serif text-[30px] text-white">{card.title}</h3>
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

/* ═══════════════════════════════════════════════════════════════
   EARRINGS BANNER — parallax with botanical curves
═══════════════════════════════════════════════════════════════ */
const EarringsBanner = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  return (
    <section ref={ref} className="relative overflow-hidden h-[50vh] min-h-[350px]">
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: bgY }}>
        <img
          src={bannerBrincos}
          alt="Coleção de Brincos"
          className="w-full h-[130%] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(172,55%,8%,0.45)] via-[hsl(172,40%,12%,0.15)] to-[hsl(172,55%,8%,0.45)]" />
      </motion.div>

      {/* Botanical corners on the banner */}
      <CornerLeaves position="top-right" opacity={0.1} className="text-white" />
      <CornerLeaves position="bottom-left" opacity={0.07} className="text-white" />

      <div className="absolute inset-0 flex items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <p className="text-[11px] tracking-[0.25em] uppercase text-white/55 mb-3">Coleção Completa</p>
          <h2 className="text-[40px] md:text-[56px] font-serif text-white mb-6">Brincos</h2>
          <Link to="/produtos?categoria=brincos">
            <Button className="h-12 px-10 text-[13px] tracking-[0.05em] uppercase font-medium bg-white/90 text-foreground hover:bg-white rounded-full backdrop-blur-sm transition-all">
              Explorar
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Organic curves */}
      <div className="absolute top-0 left-0 right-0 leading-[0] rotate-180">
        <svg viewBox="0 0 1440 50" preserveAspectRatio="none" className="w-full h-[35px] md:h-[50px] fill-background">
          <path d="M0,25 C360,50 1080,0 1440,25 L1440,50 L0,50 Z" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 leading-[0]">
        <svg viewBox="0 0 1440 50" preserveAspectRatio="none" className="w-full h-[35px] md:h-[50px] fill-background">
          <path d="M0,25 C480,0 960,50 1440,20 L1440,50 L0,50 Z" />
        </svg>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   LARI CTA — floating card with botanical accent
═══════════════════════════════════════════════════════════════ */
const LariSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-background relative overflow-hidden">
      <CornerLeaves position="bottom-left" opacity={0.03} className="text-foreground" />

      <div className="container mx-auto px-8 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto text-center bg-card rounded-3xl p-12 md:p-16 shadow-xl shadow-foreground/[0.04]"
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-8">
            <Sparkles className="h-6 w-6 text-foreground" />
          </div>
          <h2 className="text-[36px] font-serif text-foreground mb-4">
            Precisa de ajuda?
          </h2>
          <p className="text-muted-foreground text-[15px] font-light leading-relaxed mb-10">
            A Lari, nossa assistente virtual, encontra a peça perfeita pra você.
          </p>
          <Button
            className="h-12 px-10 text-[13px] tracking-[0.05em] uppercase font-medium rounded-full"
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

/* ═══════════════════════════════════════════════════════════════
   NEWSLETTER — teal bg with botanical pattern
═══════════════════════════════════════════════════════════════ */
const NewsletterSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative">
      <BotanicalDivider bgClass="fill-primary" leafOpacity={0.08} />
      <div className="bg-primary relative overflow-hidden py-20 md:py-28">
        {/* Botanical background texture */}
        <BotanicalPattern opacity={0.05} className="text-primary-foreground" />
        <CornerLeaves position="bottom-right" opacity={0.08} className="text-primary-foreground" />

        <div className="container mx-auto px-8 md:px-12 text-center max-w-md relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-[36px] font-serif text-primary-foreground mb-3">
              Fique por dentro
            </h2>
            <p className="text-primary-foreground/50 text-[15px] font-light mb-10">
              Cadastre-se e ganhe 10% OFF na primeira compra.
            </p>
            <NewsletterForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
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
