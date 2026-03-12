import { Link } from "react-router-dom";
import { useFeaturedProducts, useCategories, useProducts } from "@/hooks/useStore";
import ProductCard from "@/components/store/ProductCard";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Truck, Star } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useRef, useState } from "react";
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

  /* ── Parallax refs ─────────────────────────────────── */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1.15, 1.35]);

  const brandRef = useRef<HTMLElement>(null);
  const { scrollYProgress: brandScroll } = useScroll({
    target: brandRef,
    offset: ["start end", "end start"],
  });
  const brandY = useTransform(brandScroll, [0, 1], [60, -60]);

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
    <div className="overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════
          HERO — Full-screen parallax + editorial typography
      ═══════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex items-center justify-center min-h-screen px-6 overflow-hidden"
      >
        {/* Parallax background */}
        <motion.div
          className="absolute inset-[-15%] bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url(${heroBg})`,
            y: heroY,
            scale: heroScale,
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />

        <motion.div
          className="text-center max-w-4xl mx-auto relative z-10"
          style={{ opacity: heroOpacity }}
        >
          {/* Animated gold line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "5rem" }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 }}
            className="h-px bg-accent/70 mx-auto mb-10 overflow-hidden"
          />

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="font-sans text-[10px] uppercase text-accent mb-10"
          >
            Semijoias Premium
          </motion.p>

          <div className="overflow-hidden mb-10">
            <motion.h1
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
              className="font-serif text-[3.2rem] md:text-[6rem] lg:text-[7rem] leading-[0.95] tracking-[0.04em] text-foreground"
            >
              Curadoria
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-10">
            <motion.h1
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.2, delay: 0.9, ease: [0.22, 1, 0.36, 1] as const }}
              className="font-serif text-[3.2rem] md:text-[6rem] lg:text-[7rem] leading-[0.95] tracking-[0.04em]"
            >
              <span className="text-foreground">com </span>
              <span className="text-accent italic">intenção</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto mb-14"
          >
            Cada peça existe em nosso portfólio porque foi escolhida sob
            um rigoroso olhar editorial. Exclusividade sem excessos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:bg-accent/90 transition-all duration-500 group"
            >
              Explorar Coleção
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
            <Link
              to="/sobre"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase border border-accent/40 text-accent px-10 py-4 hover:bg-accent/10 transition-all duration-500"
            >
              Nossa História
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
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
              <div className="w-12 h-12 mx-auto mb-5 border border-accent/30 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/5 transition-all duration-500">
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
                  className="block font-sans text-[11px] tracking-[0.18em] uppercase px-8 py-4 border border-border text-muted-foreground hover:text-accent-foreground hover:border-accent hover:bg-accent transition-all duration-500"
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
        {/* Subtle background accent */}
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
                  <div className="aspect-[3/4] bg-secondary animate-pulse" />
                  <div className="h-3 w-2/3 bg-secondary animate-pulse" />
                  <div className="h-3 w-1/3 bg-secondary animate-pulse" />
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
              className="font-sans text-[11px] tracking-[0.15em] uppercase text-accent hover:text-foreground transition-colors inline-flex items-center gap-2 border border-accent/40 px-8 py-3"
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
          EDITORIAL SPLIT — Image + Text side by side
      ═══════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left — Image */}
          <motion.div
            className="relative aspect-[4/5] overflow-hidden"
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {newArrivals[0]?.foto_frontal ? (
              <img
                src={newArrivals[0].foto_frontal}
                alt="Novidade Sollaris"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="font-serif text-4xl text-muted-foreground/20">S</span>
              </div>
            )}
            {/* Accent corner decoration */}
            <div className="absolute top-0 left-0 w-16 h-16">
              <div className="absolute top-4 left-4 w-8 h-px bg-accent/60" />
              <div className="absolute top-4 left-4 h-8 w-px bg-accent/60" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16">
              <div className="absolute bottom-4 right-4 w-8 h-px bg-accent/60" />
              <div className="absolute bottom-4 right-4 h-8 w-px bg-accent/60" />
            </div>
          </motion.div>

          {/* Right — Text */}
          <motion.div
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-4">
              A Arte da Semijoia
            </p>
            <h2 className="font-serif text-display-sm md:text-display text-foreground mb-6 leading-tight">
              Feita para quem{" "}
              <span className="text-accent italic">valoriza</span>{" "}
              cada detalhe
            </h2>
            <p className="font-sans text-sm text-muted-foreground leading-[1.8] mb-8">
              Nossas peças são selecionadas com o mesmo rigor de uma editoria de moda.
              Trabalhamos com banhos de ouro 18k e pedras naturais para criar acessórios
              que transcendem tendências — são investimentos em estilo pessoal.
            </p>
            <div className="space-y-4 mb-10">
              {["Banho de ouro 18k de alta durabilidade", "Pedras naturais selecionadas", "Design exclusivo e atemporal"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rotate-45 shrink-0" />
                    <span className="font-sans text-xs text-foreground/80 tracking-wide">
                      {item}
                    </span>
                  </div>
                )
              )}
            </div>
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase text-accent hover:text-foreground transition-colors duration-300 group"
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
          NEW ARRIVALS — Horizontal scroll feel
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
          BRAND STATEMENT — Parallax quote
      ═══════════════════════════════════════════════════ */}
      <section
        ref={brandRef}
        className="relative py-32 px-6 overflow-hidden"
      >
        {/* Background subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-transparent to-secondary/20" />

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
              className="flex-1 bg-secondary border border-border px-5 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors duration-300"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="font-sans text-[11px] tracking-[0.15em] uppercase bg-accent text-accent-foreground px-8 py-3.5 hover:bg-accent/90 transition-all duration-300 disabled:opacity-50"
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
