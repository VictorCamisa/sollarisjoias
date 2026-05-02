import { Link } from "react-router-dom";
import { useFeaturedProducts, useCategories, useProducts } from "@/hooks/useStore";
import ProductCard from "@/components/store/ProductCard";
import SollarisSeal from "@/components/store/SollarisSeal";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import heroSlide1 from "@/assets/hero-bg.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";
import heroSlide5 from "@/assets/hero-slide-5.jpg";
import editorialImg from "@/assets/editorial-ring-hand.jpg";
import lookbook1 from "@/assets/lookbook-1.jpg";
import lookbook2 from "@/assets/lookbook-2.jpg";
import { useRef, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Animation primitives ────────────────────────────────── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.2 } },
};

/* ── Hero slides ─────────────────────────────────────────── */
const heroSlides = [
  {
    image: heroSlide1,
    overline: "Maison Sollaris",
    titleLine1: "Curadoria",
    titleLine2: "com",
    titleAccent: "intenção",
    description:
      "Cada peça do nosso portfólio é escolhida sob um rigoroso olhar editorial. O luxo que sussurra.",
  },
  {
    image: heroSlide2,
    overline: "Coleção Atemporal",
    titleLine1: "Elegância",
    titleLine2: "que",
    titleAccent: "permanece",
    description:
      "Joalheria contemporânea para quem entende que o verdadeiro refinamento está nos detalhes invisíveis.",
  },
  {
    image: heroSlide3,
    overline: "Edição Limitada",
    titleLine1: "Detalhes",
    titleLine2: "que",
    titleAccent: "perduram",
    description:
      "Anéis em ouro 18k com acabamento artesanal. Peças concebidas para atravessar gerações.",
  },
  {
    image: heroSlide4,
    overline: "Atelier Sollaris",
    titleLine1: "Presença",
    titleLine2: "com",
    titleAccent: "discrição",
    description:
      "Brincos statement desenhados com a contenção da alta joalheria europeia.",
  },
  {
    image: heroSlide5,
    overline: "Coleção Completa",
    titleLine1: "Refinamento",
    titleLine2: "sem",
    titleAccent: "esforço",
    description:
      "Curadoria de semijoias com pedras naturais e banho de ouro 18k de alta durabilidade.",
  },
];

/* ── Pillars (sem ícones-caixinha) ──────────────────────── */
const pillars = [
  { num: "01", title: "Curadoria Editorial", desc: "Seleção rigorosa, antes de portfólio." },
  { num: "02", title: "Garantia Maison", desc: "Seis meses contra defeitos de fabricação." },
  { num: "03", title: "Embalagem Cortesia", desc: "Acondicionamento Maison em cada envio." },
  { num: "04", title: "Banho 18k", desc: "Ouro e ródio de alta durabilidade." },
];

/* ══════════════════════════════════════════════════════════ */

const HomePage = () => {
  const { data: featured, isLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();
  const { data: allProducts } = useProducts();

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  /* Carrossel */
  const [currentSlide, setCurrentSlide] = useState(0);
  const nextSlide = useCallback(() => {
    setCurrentSlide((p) => (p + 1) % heroSlides.length);
  }, []);
  useEffect(() => {
    const t = setInterval(nextSlide, 9000);
    return () => clearInterval(t);
  }, [nextSlide]);
  const slide = heroSlides[currentSlide];

  /* Hero parallax suave */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroScroll, [0, 0.85], [1, 0]);
  const heroY = useTransform(heroScroll, [0, 1], [0, 80]);

  /* Newsletter */
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim() });
      if (error) {
        if (error.code === "23505") toast.info("Este e-mail já está cadastrado.");
        else throw error;
      } else {
        toast.success("Bem-vinda à Maison Sollaris.");
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
    <div className="overflow-x-hidden w-full bg-background">
      {/* ═══════════════════════════════════════════════════════
          HERO — editorial, com overlay leve só onde precisa
      ═══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex items-end min-h-[100svh] overflow-hidden bg-foreground/90"
      >
        {/* Background com Ken Burns mais lento e crossfade limpo */}
        <AnimatePresence mode="sync">
          <motion.div
            key={currentSlide}
            className="absolute inset-0 will-change-transform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.img
              src={slide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.06 }}
              animate={{ scale: 1.14 }}
              transition={{ duration: 9, ease: "linear" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Overlay leve apenas no canto inferior-esquerdo (onde o texto vive) */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-maison-bordeaux-deep/70 via-maison-bordeaux-deep/25 to-transparent" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-maison-bordeaux-deep/40 via-transparent to-transparent" />

        {/* Vinheta sutil pra dar peso editorial */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, hsl(var(--maison-bordeaux-deep) / 0.35) 100%)",
          }}
        />

        <motion.div
          className="relative z-10 w-full px-6 sm:px-10 md:px-16 lg:px-20 pb-20 sm:pb-24 md:pb-32"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Eyebrow + hairline */}
                <div className="flex items-center gap-4 mb-7 sm:mb-9">
                  <span className="block h-px w-10 bg-maison-creme/70" />
                  <p
                    className="text-[10px] uppercase text-maison-creme/85"
                    style={{ fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.32em" }}
                  >
                    {slide.overline}
                  </p>
                </div>

                <h1 className="font-serif text-maison-creme leading-[0.95] tracking-[-0.005em] text-[3.2rem] sm:text-[4.2rem] md:text-[6rem] lg:text-[7.4rem]">
                  <span className="block">{slide.titleLine1}</span>
                  <span className="block">
                    {slide.titleLine2}{" "}
                    <span className="italic font-light text-maison-creme/95">
                      {slide.titleAccent}
                    </span>
                  </span>
                </h1>

                <p className="mt-8 sm:mt-10 max-w-md text-[13px] sm:text-[14px] leading-[1.7] text-maison-creme/75">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTAs Maison — quadrados, sem rounded-full */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 mt-10 sm:mt-12">
              <Link
                to="/colecao"
                className="group inline-flex items-center justify-center gap-3 px-9 py-4 bg-maison-creme text-maison-bordeaux border border-maison-creme transition-all duration-700 hover:bg-transparent hover:text-maison-creme"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "10.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                }}
              >
                Explorar coleção
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.4} />
              </Link>
              <Link
                to="/sobre"
                className="inline-flex items-center justify-center gap-3 px-9 py-4 border border-maison-creme/40 text-maison-creme transition-all duration-700 hover:border-maison-creme sm:border-l-0"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "10.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                }}
              >
                A Maison
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Slide indicators — barra fina à direita */}
        <div className="absolute bottom-8 right-6 sm:right-10 md:right-16 z-10 flex items-center gap-3">
          <span
            className="text-maison-creme/50 tabular-nums"
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.2em" }}
          >
            {String(currentSlide + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-px transition-all duration-700 ${
                  i === currentSlide ? "w-10 bg-maison-creme" : "w-4 bg-maison-creme/30 hover:bg-maison-creme/60"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PILLARS — hairline strip, sem ícones-caixinha
      ═══════════════════════════════════════════════════════ */}
      <section className="border-y border-maison-bordeaux/12 bg-card">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {pillars.map((p, idx) => (
              <motion.div
                key={p.num}
                variants={fadeUp}
                className={`px-6 sm:px-8 py-9 sm:py-11 ${
                  idx < pillars.length - 1 ? "md:border-r border-maison-bordeaux/10" : ""
                } ${idx % 2 === 0 ? "border-r md:border-r border-maison-bordeaux/10" : ""} ${
                  idx < 2 ? "border-b md:border-b-0 border-maison-bordeaux/10" : ""
                }`}
              >
                <p
                  className="text-bordeaux/70 mb-3"
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.22em" }}
                >
                  {p.num}
                </p>
                <h3 className="font-serif text-[15px] sm:text-[17px] text-foreground mb-1.5 leading-snug">
                  {p.title}
                </h3>
                <p className="text-[11.5px] sm:text-[12px] leading-relaxed text-foreground/55">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          DESTAQUES
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          <motion.div
            className="flex items-end justify-between mb-14 sm:mb-20"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div>
              <p
                className="text-bordeaux mb-4"
                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.32em" }}
              >
                — Seleção
              </p>
              <h2 className="font-serif text-[2.4rem] sm:text-[3rem] md:text-[3.8rem] text-foreground leading-[1.02]">
                Destaques da <span className="italic">temporada</span>
              </h2>
            </div>
            <Link
              to="/colecao"
              className="hidden md:inline-flex items-center gap-2 text-foreground/55 hover:text-bordeaux transition-colors duration-500 group pb-2"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "10.5px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              Ver tudo
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.4} />
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/5] bg-muted animate-pulse" />
                  <div className="h-3 w-2/3 bg-muted animate-pulse" />
                  <div className="h-3 w-1/3 bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-x-5 sm:gap-x-7 gap-y-14 sm:gap-y-16"
              variants={stagger}
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
                    stockQuantity={(product as any).stock_quantity}
                    createdAt={(product as any).created_at}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Mobile CTA */}
          <motion.div className="md:hidden mt-12 text-center" variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 px-9 py-4 border border-bordeaux/40 text-bordeaux hover:bg-bordeaux hover:text-maison-creme transition-all duration-700"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "10.5px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
              }}
            >
              Ver coleção completa
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.4} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          EDITORIAL SPLIT — imagem + manifesto
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-card">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[80vh]">
          {/* Image side */}
          <motion.div
            className="relative h-[70vh] md:h-auto md:col-span-7 overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4 }}
          >
            <motion.img
              src={editorialImg}
              alt="Editorial Sollaris"
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.08 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/40 via-transparent to-transparent md:hidden" />
          </motion.div>

          {/* Text side */}
          <div className="flex items-center md:col-span-5 px-8 sm:px-12 md:px-16 lg:px-20 py-20 md:py-0">
            <motion.div
              className="max-w-md"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
                <span className="block h-px w-10 bg-bordeaux/60" />
                <p
                  className="text-bordeaux"
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.32em" }}
                >
                  — Manifesto
                </p>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="font-serif text-[1.9rem] sm:text-[2.4rem] md:text-[2.9rem] text-foreground leading-[1.05] mb-7"
              >
                Não vendemos joias.{" "}
                <span className="italic">Curamos</span>{" "}
                permanências.
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="text-[14px] text-foreground/65 leading-[1.75] mb-10"
              >
                Cada peça da Sollaris passa por um rigoroso processo de seleção editorial. Não buscamos
                volume — buscamos significado. O resultado é um portfólio enxuto de semijoias que contam
                histórias e elevam momentos íntimos.
              </motion.p>

              <motion.div variants={fadeUp}>
                <Link
                  to="/sobre"
                  className="inline-flex items-center gap-2 text-bordeaux hover:gap-4 transition-all duration-500 border-b border-bordeaux/30 hover:border-bordeaux pb-1.5"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "10.5px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                  }}
                >
                  Conheça nossa história
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.4} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CATEGORIES — pílulas Maison square
      ═══════════════════════════════════════════════════════ */}
      {categories && categories.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="max-w-[1100px] mx-auto px-6 sm:px-8">
            <motion.div
              className="text-center mb-14"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p
                className="text-bordeaux mb-4"
                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.32em" }}
              >
                — Explore
              </p>
              <h2 className="font-serif text-[2.2rem] sm:text-[2.8rem] md:text-[3.4rem] text-foreground leading-[1.05]">
                Por <span className="italic">categoria</span>
              </h2>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center gap-0 border-t border-l border-maison-bordeaux/12 max-w-3xl mx-auto"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={fadeUp} className="border-r border-b border-maison-bordeaux/12 flex-1 min-w-[140px]">
                  <Link
                    to={`/colecao?categoria=${cat.slug}`}
                    className="block px-6 py-6 text-center text-foreground/65 hover:text-maison-creme hover:bg-bordeaux transition-all duration-500"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "11px",
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                    }}
                  >
                    {cat.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          BRAND STATEMENT — sem glow rosa, só tipografia + selo
      ═══════════════════════════════════════════════════════ */}
      <section className="relative py-32 sm:py-44 px-6 overflow-hidden bg-card">
        {/* Selo gigante watermark */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04]"
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 0.04, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        >
          <SollarisSeal size={520} tone="bordeaux" />
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="maison-hairline-gold w-24 mx-auto mb-12" />

          <motion.blockquote
            variants={fadeUp}
            className="font-serif text-[2rem] sm:text-[2.8rem] md:text-[4rem] lg:text-[4.6rem] text-foreground leading-[1.04] tracking-[-0.005em] mb-10"
          >
            Refinamento que <span className="italic">atravessa</span> o tempo.
          </motion.blockquote>

          <motion.div variants={fadeUp} className="maison-hairline-gold w-24 mx-auto mb-8" />

          <motion.p
            variants={fadeUp}
            className="text-foreground/55"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10.5px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
            }}
          >
            Maison Sollaris · Est. 2024
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          NOVIDADES
      ═══════════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="py-24 sm:py-32">
          <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
            <motion.div
              className="flex items-end justify-between mb-14 sm:mb-20"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div>
                <p
                  className="text-bordeaux mb-4"
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.32em" }}
                >
                  — Recém-chegadas
                </p>
                <h2 className="font-serif text-[2.4rem] sm:text-[3rem] md:text-[3.8rem] text-foreground leading-[1.02]">
                  Novidades
                </h2>
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-x-5 sm:gap-x-7 gap-y-14 sm:gap-y-16"
              variants={stagger}
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
                    stockQuantity={(product as any).stock_quantity}
                    createdAt={(product as any).created_at}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          LOOKBOOK — square, hover discreto
      ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} className="relative group overflow-hidden aspect-[4/5]">
              <img
                src={lookbook1}
                alt="Lookbook Sollaris"
                className="w-full h-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maison-bordeaux-deep/65 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                <p
                  className="text-maison-creme/85 mb-2"
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9.5px", letterSpacing: "0.32em", textTransform: "uppercase" }}
                >
                  — Lookbook
                </p>
                <p className="font-serif text-[1.4rem] sm:text-[1.7rem] text-maison-creme leading-tight">
                  Coleção <span className="italic">Atemporal</span>
                </p>
              </div>
              <Link to="/colecao" className="absolute inset-0" aria-label="Ver coleção" />
            </motion.div>

            <motion.div variants={fadeUp} className="relative group overflow-hidden aspect-[4/5]">
              <img
                src={lookbook2}
                alt="Editorial Sollaris"
                className="w-full h-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maison-bordeaux-deep/65 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                <p
                  className="text-maison-creme/85 mb-2"
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9.5px", letterSpacing: "0.32em", textTransform: "uppercase" }}
                >
                  — Editorial
                </p>
                <p className="font-serif text-[1.4rem] sm:text-[1.7rem] text-maison-creme leading-tight">
                  Momentos de <span className="italic">luz</span>
                </p>
              </div>
              <Link to="/vitrine" className="absolute inset-0" aria-label="Ver vitrine" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          NEWSLETTER — discrição absoluta
      ═══════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 px-6 overflow-hidden border-t border-maison-bordeaux/12">
        <motion.div
          className="max-w-lg mx-auto text-center relative z-10"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp} className="flex justify-center mb-7">
            <SollarisSeal size={44} tone="bordeaux" />
          </motion.div>
          <motion.p
            variants={fadeUp}
            className="text-bordeaux mb-5"
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            — Círculo Sollaris
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-serif text-[1.8rem] sm:text-[2.3rem] md:text-[2.7rem] text-foreground mb-5 leading-[1.1]"
          >
            Acesso antecipado às nossas <span className="italic">novidades</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[13.5px] text-foreground/60 leading-relaxed mb-10 max-w-md mx-auto">
            Nossa correspondência é rara, escrita com cuidado, e reservada a quem valoriza descoberta antes do ruído.
          </motion.p>

          <motion.form variants={fadeUp} onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 sm:gap-0 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-5 py-4 bg-transparent border border-maison-bordeaux/25 text-foreground placeholder:text-foreground/35 text-[13px] focus:outline-none focus:border-bordeaux transition-colors duration-500"
              style={{ fontFamily: "Inter, sans-serif" }}
            />
            <button
              type="submit"
              disabled={subscribing}
              className="px-7 py-4 bg-bordeaux text-maison-creme border border-bordeaux hover:bg-maison-bordeaux-deep transition-all duration-500 disabled:opacity-60 sm:border-l-0"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "10.5px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
              }}
            >
              {subscribing ? "Enviando" : "Inscrever"}
            </button>
          </motion.form>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
