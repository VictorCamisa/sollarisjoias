import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, Sparkles, Diamond } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/store/ProductCard";
import NewsletterForm from "@/components/store/NewsletterForm";
import { useProducts, useCategories } from "@/hooks/useStore";
import SEOHead from "@/components/seo/SEOHead";

import bannerHero from "@/assets/banners/banner-hero.jpg";
import bannerLayering from "@/assets/banners/banner-layering.jpg";
import bannerConjuntos from "@/assets/banners/banner-conjuntos.jpg";
import bannerBrincos from "@/assets/banners/banner-brincos.jpg";
import bannerPromocional from "@/assets/banners/banner-promocional.jpg";

import catAneis from "@/assets/categories/aneis.jpg";
import catBrincos from "@/assets/categories/brincos.jpg";
import catColares from "@/assets/categories/colares.jpg";
import catConjuntos from "@/assets/categories/conjuntos.jpg";
import catPiercings from "@/assets/categories/piercings.jpg";
import catPulseiras from "@/assets/categories/pulseiras.jpg";

const categoryImages: Record<string, string> = {
  aneis: catAneis, brincos: catBrincos, colares: catColares,
  conjuntos: catConjuntos, piercings: catPiercings, pulseiras: catPulseiras,
};

/* ── Decorative divider ── */
const GoldDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    <div className="gold-line flex-1 max-w-[80px]" />
    <Diamond className="h-2.5 w-2.5 text-accent/40" />
    <div className="gold-line flex-1 max-w-[80px]" />
  </div>
);

/* ═══════════════ HERO ═══════════════ */
const HeroSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section ref={ref} className="relative h-[85vh] sm:h-[92vh] min-h-[480px] max-h-[850px] overflow-hidden">
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: bgY }}>
        <img src={bannerHero} alt="Larifa — Semijoias Premium" className="w-full h-[120%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(30,15%,8%,0.70)] via-[hsl(172,30%,12%,0.30)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(40,30%,96%,0.15)] via-transparent to-[hsl(30,15%,8%,0.10)]" />
      </motion.div>

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-5 sm:px-8 md:px-12">
          <motion.div style={{ y: textY }} className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <div className="w-8 h-[1px] bg-accent/60" />
                <p className="text-[11px] sm:text-[12px] tracking-[0.25em] uppercase font-medium text-accent">
                  Nova Coleção
                </p>
              </div>
              <h1 className="text-[34px] sm:text-[46px] md:text-[60px] lg:text-[70px] font-serif text-white leading-[1.04] mb-4 sm:mb-6">
                Semijoias que<br />
                <em className="font-light italic text-accent">contam histórias</em>
              </h1>
              <p className="text-white/50 text-[13px] sm:text-[15px] font-light mb-7 sm:mb-9 max-w-[340px] leading-relaxed">
                Peças atemporais com banho de ouro 18k,
                feitas para cada momento especial.
              </p>
              <div className="flex gap-3">
                <Link to="/produtos">
                  <Button className="h-11 sm:h-12 px-7 sm:px-10 text-[11px] sm:text-[12px] tracking-[0.08em] uppercase font-semibold bg-accent text-accent-foreground hover:bg-accent/90 rounded-none border-0 shadow-lg shadow-accent/20">
                    Ver Coleção
                  </Button>
                </Link>
                <Link to="/novidades">
                  <Button
                    variant="outline"
                    className="h-11 sm:h-12 px-7 sm:px-10 text-[11px] sm:text-[12px] tracking-[0.08em] uppercase font-semibold border-white/30 text-white bg-white/5 hover:bg-white/10 rounded-none backdrop-blur-sm"
                  >
                    Novidades
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade into bg */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

/* ═══════════════ TRUST BAR ═══════════════ */
const TrustBar = () => (
  <div className="relative z-10 -mt-8 sm:-mt-6 pb-2">
    <div className="container mx-auto px-4 sm:px-8 md:px-12">
      <div className="bg-card border border-border/60 py-4 sm:py-5 px-4 sm:px-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 sm:gap-6 overflow-x-auto text-foreground/70">
          {[
            { icon: "✦", text: "Frete grátis acima de R$199" },
            { icon: "✦", text: "Garantia de 6 meses" },
            { icon: "✦", text: "Banho de ouro 18k" },
            { icon: "✦", text: "Até 3x sem juros" },
          ].map((item) => (
            <span key={item.text} className="flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.06em] sm:tracking-[0.08em] uppercase font-medium whitespace-nowrap">
              <span className="text-accent text-[8px]">{item.icon}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════ CATEGORIES ═══════════════ */
const CategoryGrid = ({ categories }: { categories: { id: string; name: string; slug: string }[] }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="pt-14 pb-14 sm:pt-20 sm:pb-20 md:pt-24 md:pb-24">
      <div className="container mx-auto px-4 sm:px-8 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12"
        >
          <GoldDivider className="mb-4" />
          <h2 className="text-[28px] sm:text-[34px] md:text-[40px] font-serif text-foreground">Categorias</h2>
        </motion.div>

        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 md:gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link to={`/produtos?categoria=${cat.slug}`} className="group block relative">
                <div className="aspect-[3/4] overflow-hidden border border-border/40">
                  <img
                    src={categoryImages[cat.slug] || catAneis}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30,15%,8%,0.55)] via-transparent to-transparent group-hover:from-[hsl(30,15%,8%,0.40)] transition-all duration-500" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-[12px] tracking-[0.1em] uppercase font-semibold text-white text-center drop-shadow-md">
                    {cat.name}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════ FEATURED PRODUCTS ═══════════════ */
const FeaturedProducts = ({ products, loading }: { products: any[] | undefined; loading: boolean }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-14 sm:py-20 md:py-24">
      {/* Subtle warm gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-secondary/30 pointer-events-none" />

      <div className="relative container mx-auto px-4 sm:px-8 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10"
        >
          <div>
            <GoldDivider className="mb-4 justify-start" />
            <h2 className="text-[28px] sm:text-[34px] md:text-[40px] font-serif text-foreground">Mais Vendidos</h2>
          </div>
          <Link to="/produtos" className="mt-3 md:mt-0">
            <span className="text-[12px] font-semibold text-accent inline-flex items-center gap-2 hover:gap-3 transition-all uppercase tracking-[0.06em]">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
                    images={[p.foto_frontal, p.foto_lateral, p.foto_detalhe].filter(Boolean)}
                    category={(p.categories as any)?.name}
                    index={i}
                  />
                ))
              : (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  <p className="text-sm">Nenhum produto em destaque.</p>
                </div>
              )}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════ LAYERING — split editorial ═══════════════ */
const LayeringSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);

  return (
    <section ref={ref} className="relative">
      {/* Teal section with gold accent line */}
      <div className="gold-line" />
      <div className="bg-primary relative overflow-hidden grain">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[380px] sm:min-h-[500px]">
          <motion.div className="overflow-hidden relative min-h-[250px] sm:min-h-[320px] lg:min-h-full" style={{ y: imgY }}>
            <img src={bannerLayering} alt="Layering de Colares" className="w-full h-[115%] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/20 lg:to-primary/40" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center justify-center p-8 sm:p-12 md:p-16"
          >
            <div className="max-w-sm text-center lg:text-left">
              <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                <div className="w-6 h-[1px] bg-accent/70" />
                <p className="text-[10px] tracking-[0.2em] uppercase text-accent font-semibold">Tendência</p>
              </div>
              <h2 className="text-[28px] sm:text-[36px] md:text-[48px] font-serif text-primary-foreground leading-[1.08] mb-4 sm:mb-5">
                A Arte do<br />
                <em className="italic font-light">Layering</em>
              </h2>
              <p className="text-primary-foreground/55 text-[13px] sm:text-[14px] font-light leading-relaxed mb-7 sm:mb-9">
                Combine colares de diferentes comprimentos e texturas para composições sofisticadas e únicas.
              </p>
              <Link to="/produtos?categoria=colares">
                <Button className="h-11 sm:h-12 px-8 sm:px-10 text-[11px] sm:text-[12px] tracking-[0.08em] uppercase font-semibold bg-accent text-accent-foreground hover:bg-accent/90 rounded-none shadow-lg shadow-accent/15">
                  Ver Colares
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="gold-line" />
    </section>
  );
};

/* ═══════════════ EDITORIAL 2-COL ═══════════════ */
const EditorialGrid = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const cards = [
    { image: bannerConjuntos, title: "Conjuntos", subtitle: "Harmonia perfeita", link: "/produtos?categoria=conjuntos" },
    { image: bannerPromocional, title: "Presentes", subtitle: "Para momentos especiais", link: "/produtos?categoria=pulseiras" },
  ];

  return (
    <section ref={ref} className="py-14 sm:py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-8 md:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 md:gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`${i === 1 ? "sm:mt-8" : ""}`}
            >
              <Link to={card.link} className="group block relative overflow-hidden border border-border/40">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30,15%,8%,0.60)] via-[hsl(30,15%,8%,0.10)] to-transparent" />
                <div className="absolute inset-0 flex items-end p-5 sm:p-7 md:p-9">
                  <div>
                    <p className="text-accent text-[9px] sm:text-[10px] tracking-[0.15em] uppercase mb-1 font-semibold">{card.subtitle}</p>
                    <h3 className="font-serif text-[22px] sm:text-[28px] text-white">{card.title}</h3>
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

/* ═══════════════ EARRINGS BANNER ═══════════════ */
const EarringsBanner = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);

  return (
    <section ref={ref} className="relative">
      <div className="gold-line" />
      <div className="bg-primary relative overflow-hidden grain">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[350px] sm:min-h-[420px]">
          <motion.div className="overflow-hidden relative min-h-[230px] sm:min-h-[280px] lg:min-h-full order-1 lg:order-2" style={{ y: bgY }}>
            <img src={bannerBrincos} alt="Coleção de Brincos" className="w-full h-[120%] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary/20 lg:to-primary/40" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center justify-center p-8 sm:p-12 md:p-16 order-2 lg:order-1"
          >
            <div className="max-w-sm text-center lg:text-left">
              <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                <div className="w-6 h-[1px] bg-accent/70" />
                <p className="text-[10px] tracking-[0.2em] uppercase text-accent font-semibold">Coleção Completa</p>
              </div>
              <h2 className="text-[30px] sm:text-[38px] md:text-[48px] font-serif text-primary-foreground leading-[1.08] mb-4 sm:mb-5">
                Brincos
              </h2>
              <p className="text-primary-foreground/55 text-[13px] sm:text-[14px] font-light leading-relaxed mb-7 sm:mb-9">
                Argolas, gotas e studs — peças que emolduram seu rosto com elegância.
              </p>
              <Link to="/produtos?categoria=brincos">
                <Button className="h-11 sm:h-12 px-8 sm:px-10 text-[11px] sm:text-[12px] tracking-[0.08em] uppercase font-semibold bg-accent text-accent-foreground hover:bg-accent/90 rounded-none shadow-lg shadow-accent/15">
                  Explorar
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="gold-line" />
    </section>
  );
};

/* ═══════════════ LARI CTA ═══════════════ */
const LariSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-14 sm:py-20 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/40 to-background pointer-events-none" />
      <div className="relative container mx-auto px-5 sm:px-8 md:px-12 text-center max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <GoldDivider className="mb-6" />
          <div className="w-12 h-12 sm:w-14 sm:h-14 border border-accent/50 flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-serif text-foreground mb-3">
            Precisa de ajuda?
          </h2>
          <p className="text-muted-foreground text-[13px] sm:text-[14px] font-light leading-relaxed mb-7 sm:mb-8">
            A Lari, nossa assistente virtual, encontra a peça perfeita pra você.
          </p>
          <Button
            className="h-11 sm:h-12 px-8 sm:px-10 text-[11px] sm:text-[12px] tracking-[0.08em] uppercase font-semibold rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
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

/* ═══════════════ NEWSLETTER ═══════════════ */
const NewsletterSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative">
      <div className="gold-line" />
      <div className="py-14 sm:py-20 md:py-24 bg-primary grain relative">
        <div className="relative container mx-auto px-5 sm:px-8 md:px-12 text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-8 h-[1px] bg-accent/50" />
              <Diamond className="h-2.5 w-2.5 text-accent/70" />
              <div className="w-8 h-[1px] bg-accent/50" />
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-serif text-primary-foreground mb-3">
              Fique por dentro
            </h2>
            <p className="text-primary-foreground/55 text-[13px] sm:text-[14px] font-light mb-7 sm:mb-9">
              Cadastre-se e ganhe 10% OFF na primeira compra.
            </p>
            <NewsletterForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════ PAGE ═══════════════ */
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