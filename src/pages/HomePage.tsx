import { Link } from "react-router-dom";
import { useFeaturedProducts, useCategories, useProducts } from "@/hooks/useStore";
import ProductCard from "@/components/store/ProductCard";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Truck, Star } from "lucide-react";
import heroSlide1 from "@/assets/hero-bg.jpg";

import ringFloating from "@/assets/ring-floating.png";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";
import heroSlide5 from "@/assets/hero-slide-5.jpg";
import logoSollaris from "@/assets/logo-sollaris.png";
import { useRef, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Animation variants ────────────────────────────────── */

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ── Gold Divider component ────────────────────────────── */
const GoldDivider = ({ className = "" }: { className?: string }) => (
  <motion.div
    initial={{ width: 0 }}
    whileInView={{ width: "200px" }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
    className={`gold-line mx-auto ${className}`}
  />
);

/* ── Hero slides data ───────────────────────────────── */
const heroSlides = [
  {
    image: heroSlide1,
    overline: "Semijoias Premium",
    titleLine1: "Curadoria",
    titleLine2: "com",
    titleAccent: "intenção",
    description: "Cada peça existe em nosso portfólio porque foi escolhida sob um rigoroso olhar editorial. Exclusividade sem excessos.",
  },
  {
    image: heroSlide2,
    overline: "Nova Coleção",
    titleLine1: "Elegância",
    titleLine2: "que",
    titleAccent: "encanta",
    description: "Colares e brincos desenhados para transformar qualquer momento em uma ocasião especial.",
  },
  {
    image: heroSlide3,
    overline: "Edição Limitada",
    titleLine1: "Detalhes",
    titleLine2: "que",
    titleAccent: "brilham",
    description: "Pulseiras e anéis com acabamento artesanal em ouro 18k. Peças únicas para mulheres únicas.",
  },
  {
    image: heroSlide4,
    overline: "Alta Joalheria",
    titleLine1: "Presença",
    titleLine2: "com",
    titleAccent: "atitude",
    description: "Brincos statement que definem seu estilo. Porque os detalhes dizem tudo sobre quem você é.",
  },
  {
    image: heroSlide5,
    overline: "Coleção Completa",
    titleLine1: "Refinamento",
    titleLine2: "sem",
    titleAccent: "limites",
    description: "Uma curadoria completa de semijoias com pedras naturais e banho de ouro 18k de alta durabilidade.",
  },
];

/* ── Pillars data ──────────────────────────────────────── */
const pillars = [
  {
    icon: Sparkles,
    title: "Curadoria Editorial",
    desc: "Cada peça passa por um rigoroso processo de seleção antes de integrar nosso portfólio.",
  },
  {
    icon: Shield,
    title: "Garantia Sollaris",
    desc: "Todas as semijoias possuem garantia contra defeitos de fabricação por 6 meses.",
  },
  {
    icon: Truck,
    title: "Envio Cuidadoso",
    desc: "Embalagem premium com acabamento artesanal, pronta para presentear.",
  },
  {
    icon: Star,
    title: "Banho Premium",
    desc: "Ouro 18k e ródio de alta durabilidade para brilho duradouro.",
  },
];

/* ══════════════════════════════════════════════════════════ */

const HomePage = () => {
  const { data: featured, isLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();
  const { data: allProducts } = useProducts();

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  /* ── Hero carousel state ────────────────────────────── */
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 12000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = heroSlides[currentSlide];

  /* ── Parallax refs ─────────────────────────────────── */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  const brandRef = useRef<HTMLElement>(null);
  const { scrollYProgress: brandScroll } = useScroll({
    target: brandRef,
    offset: ["start end", "end start"],
  });
  const brandY = useTransform(brandScroll, [0, 1], [60, -60]);

  /* ── Ring animation (whileInView approach) ────────── */

  /* ── Newsletter handler ────────────────────────────── */
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim() });
      if (error) {
        if (error.code === "23505") {
          toast.info("Este e-mail já está cadastrado.");
        } else throw error;
      } else {
        toast.success("Bem-vinda à Sollaris! 💛");
        setEmail("");
      }
    } catch {
      toast.error("Erro ao cadastrar. Tente novamente.");
    } finally {
      setSubscribing(false);
    }
  };

  /* ── New arrivals (latest 4 products) ──────────────── */
  const newArrivals = allProducts?.slice(0, 4) ?? [];

  return (
    <div className="overflow-x-hidden w-full">
      {/* ═══════════════════════════════════════════════════
          HERO — Full-screen parallax + editorial typography
      ═══════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex items-end min-h-[100svh] px-4 sm:px-6 md:px-16 pb-20 sm:pb-24 md:pb-32 overflow-hidden"
      >
        {/* Carousel backgrounds */}
        <AnimatePresence mode="sync">
          <motion.div
            key={currentSlide}
            className="absolute inset-[-10%] bg-cover bg-center bg-no-repeat will-change-transform"
            style={{ backgroundImage: `url(${slide.image})` }}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1.18 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.5 }, scale: { duration: 5.7, ease: "linear" } }}
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/90 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent z-[1]" />

        <motion.div
          className="text-left max-w-3xl relative z-10 w-full"
          style={{ opacity: heroOpacity }}
        >
          {/* Logo mark */}
          <img
            src={logoSollaris}
            alt="SOLLARIS"
            className="w-48 md:w-64 h-auto mb-8 opacity-15"
          />

          {/* Gold line */}
          <div className="h-px w-20 bg-accent/70 mb-8" />

          {/* Animated text — changes with each slide */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-accent mb-8">
                {slide.overline}
              </p>

              <div className="overflow-hidden mb-4">
                <motion.h1
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }}
                  className="font-serif text-[3.2rem] md:text-[6rem] lg:text-[7rem] leading-[0.95] tracking-[0.04em] text-foreground"
                >
                  {slide.titleLine1}
                </motion.h1>
              </div>
              <div className="overflow-hidden mb-10">
                <motion.h1
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
                  className="font-serif text-[3.2rem] md:text-[6rem] lg:text-[7rem] leading-[0.95] tracking-[0.04em]"
                >
                  <span className="text-foreground">{slide.titleLine2} </span>
                  <span className="text-accent italic">{slide.titleAccent}</span>
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mb-12"
              >
                {slide.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* CTAs — static */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 rounded-full hover:bg-accent/90 hover:shadow-[0_0_30px_hsl(var(--accent)/0.3)] transition-all duration-500 group"
            >
              Explorar Coleção
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
            <Link
              to="/sobre"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase border border-accent/40 text-accent px-10 py-4 rounded-full hover:bg-accent/10 transition-all duration-500"
            >
              Nossa História
            </Link>
          </div>
        </motion.div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 right-6 md:right-16 z-10 flex items-center gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentSlide
                  ? "w-8 bg-accent"
                  : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
        >
          <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-muted-foreground">Scroll</span>
          <motion.div
            className="w-px h-8 bg-accent/40"
            animate={{ scaleY: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ originY: 0 }}
          />
        </motion.div>
      </section>

      {/* ═══════ TRANSITION DIVIDER ═══════ */}
      <div className="relative py-2">
        <GoldDivider />
      </div>

      {/* ═══════════════════════════════════════════════════
          PILLARS — Brand values
      ═══════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 py-24">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.title}
              variants={fadeUp}
              className="text-center group"
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl border border-accent/25 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/5 transition-all duration-500">
                <pillar.icon className="h-5 w-5 text-accent" strokeWidth={1.2} />
              </div>
              <h3 className="font-serif text-sm md:text-base text-foreground mb-2">
                {pillar.title}
              </h3>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════ TRANSITION ═══════ */}
      <GoldDivider />

      {/* ═══════════════════════════════════════════════════
          CATEGORIES — Interactive grid
      ═══════════════════════════════════════════════════ */}
      {categories && categories.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <motion.div
            className="text-center mb-14"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-3">
              Explore
            </p>
            <h2 className="font-serif text-display-sm md:text-display text-foreground">
              Categorias
            </h2>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <Link
                  to={`/colecao?categoria=${cat.slug}`}
                  className="block font-sans text-[11px] tracking-[0.18em] uppercase px-8 py-3.5 rounded-full border border-border text-muted-foreground hover:text-accent-foreground hover:border-accent hover:bg-accent transition-all duration-500"
                >
                  {cat.name}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          FEATURED PRODUCTS — Main showcase
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div
            className="flex items-end justify-between mb-14"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div>
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-3">
                Seleção
              </p>
              <h2 className="font-serif text-display-sm md:text-display text-foreground">
                Destaques
              </h2>
            </div>
            <Link
              to="/colecao"
              className="font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors duration-300 hidden md:flex items-center gap-2 group pb-1"
            >
              Ver tudo
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-secondary rounded-2xl animate-pulse" />
                  <div className="h-3 w-2/3 bg-secondary rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-secondary rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {featured?.map((product) => (
                <motion.div key={product.id} variants={fadeUp}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.original_price}
                    image={product.foto_frontal || product.images?.[0] || null}
                    category={(product.categories as any)?.name}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            className="md:hidden mt-12 text-center"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Link
              to="/colecao"
              className="font-sans text-[11px] tracking-[0.15em] uppercase text-accent hover:text-foreground transition-colors inline-flex items-center gap-2 border border-accent/40 rounded-full px-8 py-3"
            >
              Ver coleção completa
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════ TRANSITION ═══════ */}
      <GoldDivider />

      {/* ═══════════════════════════════════════════════════
          EDITORIAL — Ring showcase
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        {/* Centered ring with glow */}
        <div className="flex flex-col items-center justify-center relative">
          <motion.div
            className="relative mb-16"
            initial={{ opacity: 0, y: 80, rotate: 30, scale: 0.5 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Glow behind ring */}
            <div className="absolute inset-0 -m-12 rounded-full bg-accent/20 blur-3xl" />
            <img
              src={ringFloating}
              alt="Anel dourado"
              className="relative w-40 md:w-64 h-auto drop-shadow-[0_0_60px_hsl(var(--accent)/0.6)]"
            />
          </motion.div>

          {/* Phrases staggering in */}
          <motion.div
            className="text-center max-w-xl px-6 space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.3, delayChildren: 0.5 } },
            }}
          >
            <motion.p
              className="font-serif text-[1.4rem] md:text-[2.2rem] text-foreground leading-tight"
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.8 }}
            >
              Uma peça que <span className="text-accent italic">conta sua história</span>
            </motion.p>
            <motion.p
              className="font-serif text-[1.4rem] md:text-[2.2rem] text-foreground leading-tight"
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.8 }}
            >
              Feita para <span className="text-accent italic">brilhar com você</span>
            </motion.p>
            <motion.p
              className="font-serif text-[1.4rem] md:text-[2.2rem] text-foreground leading-tight"
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.8 }}
            >
              Do atelier ao seu <span className="text-accent italic">momento</span>
            </motion.p>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            viewport={{ once: true }}
          >
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase text-accent border border-accent/40 rounded-full px-8 py-3.5 hover:bg-accent hover:text-accent-foreground transition-all duration-500 group"
            >
              Descobrir Peças
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════ TRANSITION ═══════ */}
      <GoldDivider />

      {/* ═══════════════════════════════════════════════════
          NEW ARRIVALS
      ═══════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="py-24">
          <div className="max-w-[1200px] mx-auto px-6">
            <motion.div
              className="text-center mb-14"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-3">
                Recém-chegadas
              </p>
              <h2 className="font-serif text-display-sm md:text-display text-foreground">
                Novidades
              </h2>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {newArrivals.map((product) => (
                <motion.div key={product.id} variants={fadeUp}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.original_price}
                    image={product.foto_frontal || product.images?.[0] || null}
                    category={(product.categories as any)?.name}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════ TRANSITION ═══════ */}
      <GoldDivider />

      {/* ═══════════════════════════════════════════════════
          BRAND STATEMENT — Parallax quote with large logo
      ═══════════════════════════════════════════════════ */}
      <section
        ref={brandRef}
        className="relative py-32 px-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-transparent to-secondary/20" />

        {/* Large background logo watermark */}
        <motion.img
          src={logoSollaris}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] md:w-[40%] h-auto opacity-[0.04]"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 0.04, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
        />

        <motion.div
          className="max-w-2xl mx-auto text-center relative z-10"
          style={{ y: brandY }}
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "4rem" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
            className="gold-line mx-auto mb-12"
          />
          <motion.blockquote
            className="font-serif text-[1.8rem] md:text-[3rem] lg:text-[3.5rem] text-foreground leading-[1.1] mb-8"
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Refinamento que{" "}
            <span className="text-accent italic">atravessa</span>{" "}
            o tempo.
          </motion.blockquote>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "4rem" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 }}
            className="gold-line mx-auto mb-6"
          />
          <motion.p
            className="font-sans text-xs text-muted-foreground tracking-[0.2em] uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Sollaris · Alta Joalheria
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════ TRANSITION ═══════ */}
      <GoldDivider />

      {/* ═══════════════════════════════════════════════════
          NEWSLETTER — Lead capture
      ═══════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-xl mx-auto text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <img
            src={logoSollaris}
            alt="SOLLARIS"
            className="w-28 h-auto opacity-15 mx-auto mb-6"
          />
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-4">
            Exclusividade
          </p>
          <h2 className="font-serif text-display-sm text-foreground mb-4">
            Faça parte do nosso círculo
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-10">
            Receba em primeira mão lançamentos, ofertas exclusivas e conteúdo editorial sobre o universo das semijoias.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              required
              className="flex-1 bg-secondary border border-border rounded-full px-6 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors duration-300"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="font-sans text-[11px] tracking-[0.15em] uppercase bg-accent text-accent-foreground rounded-full px-8 py-3.5 hover:bg-accent/90 hover:shadow-[0_0_25px_hsl(var(--accent)/0.25)] transition-all duration-300 disabled:opacity-50"
            >
              {subscribing ? "Enviando..." : "Inscrever-se"}
            </button>
          </form>

          <p className="font-sans text-[10px] text-muted-foreground mt-4">
            Sem spam. Cancelamento a qualquer momento.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
