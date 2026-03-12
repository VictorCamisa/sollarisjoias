import { Link } from "react-router-dom";
import { useFeaturedProducts, useCategories, useProducts } from "@/hooks/useStore";
import ProductCard from "@/components/store/ProductCard";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Truck, Star, ChevronRight } from "lucide-react";
import heroSlide1 from "@/assets/hero-bg.jpg";
import ringFloating from "@/assets/ring-floating.png";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";
import heroSlide5 from "@/assets/hero-slide-5.jpg";
import logoSollaris from "@/assets/logo-sollaris.png";
import editorialImg from "@/assets/editorial-ring-hand.jpg";
import lookbook1 from "@/assets/lookbook-1.jpg";
import lookbook2 from "@/assets/lookbook-2.jpg";
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
  visible: { opacity: 1, transition: { duration: 1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ── Gold Divider ────────────────────────────────────────── */
const GoldDivider = ({ className = "" }: { className?: string }) => (
  <motion.div
    initial={{ width: 0 }}
    whileInView={{ width: "200px" }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
    className={`gold-line mx-auto ${className}`}
  />
);

/* ── Hero slides ───────────────────────────────────────── */
const heroSlides = [
  {
    image: heroSlide1,
    overline: "Semijoias Premium",
    titleLine1: "Curadoria",
    titleLine2: "com",
    titleAccent: "intenção",
    description: "Cada peça existe em nosso portfólio porque foi escolhida sob um rigoroso olhar editorial.",
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
    description: "Brincos statement que definem seu estilo. Os detalhes dizem tudo sobre quem você é.",
  },
  {
    image: heroSlide5,
    overline: "Coleção Completa",
    titleLine1: "Refinamento",
    titleLine2: "sem",
    titleAccent: "limites",
    description: "Curadoria completa de semijoias com pedras naturais e banho de ouro 18k de alta durabilidade.",
  },
];

/* ── Pillars ─────────────────────────────────────────── */
const pillars = [
  { icon: Sparkles, title: "Curadoria Editorial", desc: "Rigoroso processo de seleção antes de integrar nosso portfólio." },
  { icon: Shield, title: "Garantia Sollaris", desc: "Garantia contra defeitos de fabricação por 6 meses." },
  { icon: Truck, title: "Envio Cuidadoso", desc: "Embalagem premium com acabamento artesanal." },
  { icon: Star, title: "Banho Premium", desc: "Ouro 18k e ródio de alta durabilidade." },
];

/* ══════════════════════════════════════════════════════════ */

const HomePage = () => {
  const { data: featured, isLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();
  const { data: allProducts } = useProducts();

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  /* ── Hero carousel ───────────────────────────────────── */
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 12000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = heroSlides[currentSlide];

  /* ── Parallax ─────────────────────────────────────────── */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.95]);

  const brandRef = useRef<HTMLElement>(null);
  const { scrollYProgress: brandScroll } = useScroll({
    target: brandRef,
    offset: ["start end", "end start"],
  });
  const brandY = useTransform(brandScroll, [0, 1], [60, -60]);

  /* ── Newsletter ────────────────────────────────────────── */
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

  const newArrivals = allProducts?.slice(0, 4) ?? [];

  return (
    <div className="overflow-x-hidden w-full">

      {/* ═══════════════════════════════════════════════════
          HERO — Fullscreen cinematic carousel
      ═══════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex items-end min-h-[100svh] overflow-hidden"
      >
        {/* Carousel backgrounds with Ken Burns */}
        <AnimatePresence mode="sync">
          <motion.div
            key={currentSlide}
            className="absolute inset-[-10%] bg-cover bg-center bg-no-repeat will-change-transform"
            style={{ backgroundImage: `url(${slide.image})` }}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1.18 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.5 }, scale: { duration: 12, ease: "linear" } }}
          />
        </AnimatePresence>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent z-[1]" />

        <motion.div
          className="relative z-10 w-full px-5 sm:px-8 md:px-16 pb-24 sm:pb-28 md:pb-36"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Overline gold bar */}
          <motion.div
            className="h-px w-16 sm:w-20 bg-accent/70 mb-6 sm:mb-8"
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-sans text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-accent mb-6 sm:mb-8">
                {slide.overline}
              </p>

              <div className="overflow-hidden mb-2 sm:mb-3">
                <motion.h1
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif text-[2.6rem] sm:text-[3.5rem] md:text-[5.5rem] lg:text-[7rem] leading-[0.92] tracking-[0.02em] text-foreground"
                >
                  {slide.titleLine1}
                </motion.h1>
              </div>
              <div className="overflow-hidden mb-8 sm:mb-10">
                <motion.h1
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif text-[2.6rem] sm:text-[3.5rem] md:text-[5.5rem] lg:text-[7rem] leading-[0.92] tracking-[0.02em]"
                >
                  <span className="text-foreground">{slide.titleLine2} </span>
                  <span className="text-accent italic">{slide.titleAccent}</span>
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="font-sans text-[13px] sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mb-10 sm:mb-12"
              >
                {slide.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              to="/colecao"
              className="inline-flex items-center justify-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase bg-accent text-accent-foreground px-8 sm:px-10 py-4 rounded-full hover:bg-accent/90 active:scale-[0.97] transition-all duration-500 group"
            >
              Explorar Coleção
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
            <Link
              to="/sobre"
              className="inline-flex items-center justify-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase border border-foreground/30 text-foreground px-8 sm:px-10 py-4 rounded-full hover:border-accent hover:text-accent active:scale-[0.97] transition-all duration-500"
            >
              Nossa História
            </Link>
          </div>
        </motion.div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 right-5 sm:right-8 md:right-16 z-10 flex items-center gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentSlide
                  ? "w-8 bg-accent"
                  : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 hidden sm:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
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

      {/* ═══════ PILLARS — Horizontal strip ═══════ */}
      <section className="border-y border-border bg-secondary/30">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {pillars.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                variants={fadeUp}
                className={`flex items-center gap-4 px-5 sm:px-8 py-6 sm:py-8 ${
                  idx < pillars.length - 1 ? "border-r border-border" : ""
                } ${idx < 2 ? "border-b md:border-b-0 border-border" : ""}`}
              >
                <div className="w-10 h-10 shrink-0 rounded-xl border border-accent/25 flex items-center justify-center">
                  <pillar.icon className="h-4 w-4 text-accent" strokeWidth={1.2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-[11px] sm:text-xs font-medium text-foreground mb-0.5 truncate">
                    {pillar.title}
                  </h3>
                  <p className="font-sans text-[10px] sm:text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {pillar.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURED — Main product showcase
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <motion.div
            className="flex items-end justify-between mb-12 sm:mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div>
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-2 sm:mb-3">
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
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
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
              className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-12"
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

          {/* Mobile CTA */}
          <motion.div
            className="md:hidden mt-10 text-center"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Link
              to="/colecao"
              className="font-sans text-[11px] tracking-[0.15em] uppercase text-accent hover:text-foreground transition-colors inline-flex items-center gap-2 border border-accent/40 rounded-full px-8 py-3.5"
            >
              Ver coleção completa
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          EDITORIAL SPLIT — Lifestyle + text side-by-side
      ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh] md:min-h-[85vh]">
          {/* Image side */}
          <motion.div
            className="relative h-[60vh] md:h-auto overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
          >
            <motion.img
              src={editorialImg}
              alt="Editorial Sollaris"
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20 md:to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:hidden" />
          </motion.div>

          {/* Text side */}
          <div className="flex items-center justify-center px-8 sm:px-12 md:px-16 lg:px-24 py-16 sm:py-20 md:py-0 bg-secondary/20">
            <motion.div
              className="max-w-md"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} className="h-px w-12 bg-accent/60 mb-8" />
              <motion.p
                variants={fadeUp}
                className="font-sans text-[10px] tracking-[0.4em] uppercase text-accent mb-6"
              >
                Nossa Filosofia
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="font-serif text-[1.8rem] sm:text-[2.2rem] md:text-[2.8rem] text-foreground leading-[1.08] mb-6"
              >
                Não vendemos joias.{" "}
                <span className="text-accent italic">Curamos</span>{" "}
                experiências.
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="font-sans text-sm text-muted-foreground leading-relaxed mb-8"
              >
                Cada peça da Sollaris passa por um rigoroso processo de seleção editorial.
                Não buscamos volume — buscamos significado. O resultado é um portfólio enxuto
                de semijoias que contam histórias e elevam momentos.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Link
                  to="/sobre"
                  className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.18em] uppercase text-accent hover:text-foreground transition-colors group"
                >
                  Conheça nossa história
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ TRANSITION ═══════ */}
      <div className="py-3"><GoldDivider /></div>

      {/* ═══════════════════════════════════════════════════
          CATEGORIES — Pill navigation
      ═══════════════════════════════════════════════════ */}
      {categories && categories.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
            <motion.div
              className="text-center mb-12 sm:mb-14"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-2 sm:mb-3">
                Explore
              </p>
              <h2 className="font-serif text-display-sm md:text-display text-foreground">
                Categorias
              </h2>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center gap-3 sm:gap-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={fadeUp}>
                  <Link
                    to={`/colecao?categoria=${cat.slug}`}
                    className="block font-sans text-[11px] tracking-[0.18em] uppercase px-7 sm:px-8 py-3 sm:py-3.5 rounded-full border border-border text-muted-foreground hover:text-accent-foreground hover:border-accent hover:bg-accent active:scale-[0.97] transition-all duration-500"
                  >
                    {cat.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          EDITORIAL RING — Floating showcase
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-36 overflow-hidden bg-secondary/20">
        <div className="flex flex-col items-center justify-center relative">
          <motion.div
            className="relative mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 80, rotate: 30, scale: 0.5 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="absolute inset-0 -m-12 rounded-full bg-accent/15 blur-3xl" />
            <img
              src={ringFloating}
              alt="Anel dourado Sollaris"
              className="relative w-36 sm:w-48 md:w-64 h-auto drop-shadow-[0_0_60px_hsl(var(--accent)/0.5)]"
            />
          </motion.div>

          <motion.div
            className="text-center max-w-xl px-6 space-y-3 sm:space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.25, delayChildren: 0.4 } },
            }}
          >
            {[
              { text: "Uma peça que ", accent: "conta sua história" },
              { text: "Feita para ", accent: "brilhar com você" },
              { text: "Do atelier ao seu ", accent: "momento" },
            ].map((line, i) => (
              <motion.p
                key={i}
                className="font-serif text-[1.3rem] sm:text-[1.6rem] md:text-[2.2rem] text-foreground leading-tight"
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.8 }}
              >
                {line.text}<span className="text-accent italic">{line.accent}</span>
              </motion.p>
            ))}
          </motion.div>

          <motion.div
            className="mt-10 sm:mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            viewport={{ once: true }}
          >
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase text-accent border border-accent/40 rounded-full px-8 py-3.5 hover:bg-accent hover:text-accent-foreground active:scale-[0.97] transition-all duration-500 group"
            >
              Descobrir Peças
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          NEW ARRIVALS
      ═══════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
            <motion.div
              className="text-center mb-12 sm:mb-14"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-2 sm:mb-3">
                Recém-chegadas
              </p>
              <h2 className="font-serif text-display-sm md:text-display text-foreground">
                Novidades
              </h2>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-12"
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

      {/* ═══════════════════════════════════════════════════
          LOOKBOOK — Dual image editorial
      ═══════════════════════════════════════════════════ */}
      <section className="py-6 sm:py-10 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} className="relative group overflow-hidden rounded-2xl aspect-[4/5]">
              <img
                src={lookbook1}
                alt="Lookbook Sollaris"
                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-accent mb-2">Lookbook</p>
                <p className="font-serif text-xl sm:text-2xl text-foreground">Coleção Atemporal</p>
              </div>
              <Link to="/colecao" className="absolute inset-0" aria-label="Ver coleção" />
            </motion.div>

            <motion.div variants={fadeUp} className="relative group overflow-hidden rounded-2xl aspect-[4/5]">
              <img
                src={lookbook2}
                alt="Lookbook Sollaris"
                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-accent mb-2">Editorial</p>
                <p className="font-serif text-xl sm:text-2xl text-foreground">Momentos de Luz</p>
              </div>
              <Link to="/vitrine" className="absolute inset-0" aria-label="Ver vitrine" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ TRANSITION ═══════ */}
      <div className="py-3"><GoldDivider /></div>

      {/* ═══════════════════════════════════════════════════
          BRAND STATEMENT — Parallax quote
      ═══════════════════════════════════════════════════ */}
      <section
        ref={brandRef}
        className="relative py-24 sm:py-36 px-5 sm:px-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-transparent to-secondary/20" />

        <motion.img
          src={logoSollaris}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] md:w-[35%] h-auto opacity-[0.03]"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 0.03, scale: 1 }}
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
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="gold-line mx-auto mb-10 sm:mb-12"
          />
          <motion.blockquote
            className="font-serif text-[1.6rem] sm:text-[2rem] md:text-[3rem] lg:text-[3.5rem] text-foreground leading-[1.08] mb-8"
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
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="gold-line mx-auto mb-5 sm:mb-6"
          />
          <motion.p
            className="font-sans text-[10px] sm:text-xs text-muted-foreground tracking-[0.2em] uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Sollaris · Alta Joalheria
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════
          NEWSLETTER — Lead capture
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 px-5 sm:px-6 overflow-hidden border-t border-border">
        {/* Subtle bg pattern */}
        <div className="absolute inset-0 bg-secondary/30" />

        <motion.div
          className="max-w-xl mx-auto text-center relative z-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <img
            src={logoSollaris}
            alt=""
            className="w-24 sm:w-28 h-auto opacity-10 mx-auto mb-6"
          />
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-3 sm:mb-4">
            Exclusividade
          </p>
          <h2 className="font-serif text-display-sm text-foreground mb-4">
            Faça parte do nosso círculo
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-8 sm:mb-10 max-w-sm mx-auto">
            Receba em primeira mão lançamentos, ofertas exclusivas e conteúdo editorial sobre o universo das semijoias.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              required
              className="flex-1 bg-background border border-border rounded-full px-6 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors duration-300"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="font-sans text-[11px] tracking-[0.15em] uppercase bg-accent text-accent-foreground rounded-full px-8 py-3.5 hover:bg-accent/90 active:scale-[0.97] transition-all duration-300 disabled:opacity-50"
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
