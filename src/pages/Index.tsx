import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Truck, CreditCard, Gem } from "lucide-react";
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

/* ─── Hero ─── */
const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative h-[500px] md:h-[600px] overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y }}>
        <img
          src={bannerHero}
          alt="Larifa — Semijoias Premium"
          className="w-full h-[115%] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
      </motion.div>

      <motion.div style={{ opacity }} className="absolute inset-0 flex items-end z-10">
        <div className="w-full px-4 md:px-10 pb-12 md:pb-20 max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-[42px] md:text-[52px] font-serif font-normal text-white leading-[1.05] tracking-[-0.01em]"
          >
            Feitas para mulheres<br />
            que sabem o valor de<br />
            <em className="text-accent">cada detalhe</em>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Link to="/produtos">
              <Button className="h-12 px-8 rounded-lg text-[13px] tracking-[0.06em] uppercase font-sans font-semibold bg-primary text-primary-foreground hover:bg-larifa-blue-dark hover:-translate-y-0.5 transition-all duration-300">
                Ver Coleção <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/novidades">
              <Button variant="outline" className="h-12 px-8 rounded-lg text-[13px] tracking-[0.06em] uppercase font-sans font-semibold border-white/30 text-white hover:bg-white/10 hover:border-white">
                Novidades
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

/* ─── Trust Bar ─── */
const TrustBar = () => (
  <section className="bg-card border-y border-border py-4">
    <div className="container mx-auto px-4 md:px-10 flex items-center justify-center gap-6 md:gap-12 flex-wrap">
      {[
        { icon: Truck, text: "Frete grátis +R$199" },
        { icon: Shield, text: "Garantia de 6 meses" },
        { icon: CreditCard, text: "Até 3x sem juros" },
        { icon: Gem, text: "Banho de ouro 18k" },
      ].map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-[12px] font-sans font-medium tracking-wide">{text}</span>
        </div>
      ))}
    </div>
  </section>
);

/* ─── Categories ─── */
const CategoryGrid = ({ categories }: { categories: { id: string; name: string; slug: string }[] }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-[32px] font-serif font-normal text-foreground">Categorias</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                to={`/produtos?categoria=${cat.slug}`}
                className="group block border border-border hover:border-primary/30 rounded-xl p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="font-serif text-base text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Best Sellers ─── */
const BestSellers = ({ products, loading }: { products: any[] | undefined; loading: boolean }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10"
        >
          <div>
            <p className="text-[11px] tracking-[0.10em] uppercase font-sans font-semibold text-accent mb-2">Curadoria</p>
            <h2 className="text-[32px] font-serif font-normal text-foreground">Mais Vendidos</h2>
          </div>
          <Link to="/produtos" className="mt-3 md:mt-0">
            <span className="text-[13px] font-sans font-medium text-primary hover:text-larifa-blue-dark transition-colors underline underline-offset-4">
              Ver tudo →
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
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
                  <p className="text-sm font-sans">Nenhum produto em destaque.</p>
                </div>
              )}
        </div>
      </div>
    </section>
  );
};

/* ─── Layering Banner (Full Width) ─── */
const LayeringBanner = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2"
      >
        {/* Image */}
        <div className="aspect-square overflow-hidden">
          <img 
            src={bannerLayering} 
            alt="Layering de Colares" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content */}
        <div className="bg-[#0F3460] flex items-center justify-center p-8 md:p-12">
          <div className="text-center max-w-md">
            <p className="text-[11px] tracking-[0.15em] uppercase font-sans font-semibold text-accent mb-4">
              Tendência
            </p>
            <h2 className="text-[32px] md:text-[40px] font-serif font-normal text-white mb-4 leading-tight">
              A Arte do Layering
            </h2>
            <p className="text-white/70 font-sans text-base leading-relaxed mb-8">
              Combine colares de diferentes comprimentos e estilos para criar um visual único e sofisticado.
            </p>
            <Link to="/produtos?categoria=colares">
              <Button className="h-12 px-8 rounded-lg text-[13px] tracking-[0.06em] uppercase font-sans font-semibold bg-accent text-accent-foreground hover:bg-larifa-gold-light">
                Ver Colares
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

/* ─── Editorial Banners (2 columns) ─── */
const EditorialBanners = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="grid grid-cols-1 md:grid-cols-2 min-h-[300px]">
      {/* Banner: Conjuntos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden group"
      >
        <img src={bannerConjuntos} alt="Conjuntos Larifa" className="w-full h-full object-cover min-h-[300px] group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/40 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <h3 className="font-serif text-2xl md:text-3xl text-white mb-4">Conjuntos</h3>
            <p className="text-white/80 text-sm font-sans mb-4 max-w-xs mx-auto">
              Brinco + colar em harmonia perfeita
            </p>
            <Link to="/produtos">
              <Button className="rounded-lg h-10 px-6 text-[12px] tracking-[0.06em] uppercase font-sans font-semibold bg-accent text-accent-foreground hover:bg-larifa-gold-light">
                Explorar
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Banner: Promocional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative overflow-hidden group"
      >
        <img src={bannerPromocional} alt="Presentes Especiais" className="w-full h-full object-cover min-h-[300px] group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/40 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <h3 className="font-serif text-2xl md:text-3xl text-white mb-4">Presentes Especiais</h3>
            <p className="text-white/80 text-sm font-sans mb-4 max-w-xs mx-auto">
              Para momentos inesquecíveis
            </p>
            <Link to="/produtos?categoria=pulseiras">
              <Button className="rounded-lg h-10 px-6 text-[12px] tracking-[0.06em] uppercase font-sans font-semibold bg-primary text-primary-foreground hover:bg-larifa-blue-dark">
                Ver Pulseiras
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

/* ─── Earrings Banner (Full Width Thin) ─── */
const EarringsBanner = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <Link to="/produtos?categoria=brincos" className="block group">
          <div className="relative">
            <img 
              src={bannerBrincos} 
              alt="Coleção de Brincos" 
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/50 via-transparent to-foreground/50 group-hover:from-foreground/40 group-hover:to-foreground/40 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <p className="text-[11px] tracking-[0.15em] uppercase font-sans font-semibold text-accent mb-2">
                  Coleção Completa
                </p>
                <h2 className="text-[28px] md:text-[36px] font-serif font-normal text-white">
                  Brincos
                </h2>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
};

/* ─── Lari CTA Section ─── */
const LariSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 md:py-20 bg-larifa-bg-warm">
      <div className="container mx-auto px-4 md:px-10 text-center max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="h-6 w-6 text-accent mx-auto mb-4" />
          <h2 className="text-[32px] font-serif font-normal text-foreground mb-4">
            Precisa de ajuda para escolher?
          </h2>
          <p className="text-muted-foreground font-sans text-base leading-relaxed mb-8">
            A Lari, nossa assistente, encontra a peça perfeita pra você em minutos.
          </p>
          <Button
            className="h-12 px-8 rounded-lg text-[13px] tracking-[0.06em] uppercase font-sans font-semibold bg-primary text-primary-foreground hover:bg-larifa-blue-dark hover:-translate-y-0.5 transition-all duration-300"
            onClick={() => {
              const btn = document.querySelector('[data-style-assistant-trigger]') as HTMLButtonElement;
              btn?.click();
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" /> Falar com a Lari
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Newsletter Section ─── */
const NewsletterSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 md:py-20 bg-primary">
      <div className="container mx-auto px-4 md:px-10 text-center max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[32px] font-serif font-normal text-primary-foreground mb-3">
            Fique por dentro
          </h2>
          <p className="text-primary-foreground/70 font-sans text-sm mb-8">
            Cadastre seu e-mail e ganhe 10% OFF na primeira compra.
          </p>
          <NewsletterForm />
        </motion.div>
      </div>
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
      <TrustBar />
      {categories && categories.length > 0 && <CategoryGrid categories={categories} />}
      <BestSellers products={featured} loading={loadingFeatured} />
      <LayeringBanner />
      <EditorialBanners />
      <EarringsBanner />
      <LariSection />
      <NewsletterSection />
    </>
  );
};

export default Index;
