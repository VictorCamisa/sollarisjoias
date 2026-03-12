import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowDown, ArrowRight, Share2, Check, Copy } from "lucide-react";
import { useFeaturedProducts, useCategories, useSettings } from "@/hooks/useStore";
import { cn } from "@/lib/utils";

/* ─── helpers ─── */
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const whatsappLink = (phone: string, product: { name: string; price: number; id: string }) => {
  const msg = encodeURIComponent(
    `Olá! Tenho interesse na peça *${product.name}* (${fmt(product.price)}).\nhttps://sollaris.com/produto/${product.id}`
  );
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`;
};

/* ─── Parallax image wrapper ─── */
const ParallaxImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y }}
        className="w-full h-[120%] object-cover"
        loading="lazy"
      />
    </div>
  );
};

/* ─── Reveal animation ─── */
const Reveal = ({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const initial =
    direction === "up" ? { opacity: 0, y: 60 } :
    direction === "left" ? { opacity: 0, x: -60 } :
    direction === "right" ? { opacity: 0, x: 60 } :
    { opacity: 0 };
  const animate = inView ? { opacity: 1, y: 0, x: 0 } : {};

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Stagger text reveal ─── */
const TextReveal = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("inline-flex flex-wrap", className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: delay + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

/* ─── Full-bleed hero spread ─── */
const HeroSpread = ({ product, phone }: { product: any; phone: string }) => {
  const img = product.foto_lifestyle || product.foto_frontal || product.images?.[0];
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={ref} className="relative h-[100svh] w-full overflow-hidden">
      {img ? (
        <motion.img
          src={img}
          alt={product.name}
          style={{ scale }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary" />
      )}

      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />

      <motion.div
        style={{ opacity }}
        className="absolute inset-0 flex flex-col justify-end pb-16 md:pb-24 px-6 md:px-16 lg:px-24"
      >
        <div className="max-w-2xl space-y-5">
          {product.categories?.name && (
            <Reveal delay={0.2} direction="left">
              <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-accent">
                {product.categories.name}
              </span>
            </Reveal>
          )}

          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-foreground leading-[0.95]">
            <TextReveal text={product.name} delay={0.3} />
          </h2>

          {product.description && (
            <Reveal delay={0.6}>
              <p className="font-sans text-sm md:text-base text-foreground/70 leading-relaxed max-w-lg line-clamp-2">
                {product.description}
              </p>
            </Reveal>
          )}

          <Reveal delay={0.7}>
            <div className="flex items-center gap-6">
              <span className="font-serif text-2xl md:text-3xl text-accent">
                {fmt(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="font-sans text-sm text-foreground/40 line-through">
                  {fmt(product.original_price)}
                </span>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.8}>
            <motion.a
              href={whatsappLink(phone, product)}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03, boxShadow: "0 0 40px hsl(39 41% 70% / 0.2)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-full"
            >
              <MessageCircle className="h-4 w-4" />
              Tenho interesse
            </motion.a>
          </Reveal>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4 text-accent/60" strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </section>
  );
};

/* ─── Editorial duo (2 images side by side with text) ─── */
const EditorialDuo = ({
  products,
  phone,
}: {
  products: any[];
  phone: string;
}) => {
  if (products.length < 2) return null;
  const [a, b] = products;

  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-12">
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {[a, b].map((product, i) => {
          const img = product.foto_frontal || product.images?.[0];
          return (
            <Reveal key={product.id} delay={i * 0.15} direction={i === 0 ? "left" : "right"}>
              <div className="group relative">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                  {img ? (
                    <ParallaxImage src={img} alt={product.name} className="absolute inset-0 rounded-2xl" />
                  ) : (
                    <div className="absolute inset-0 bg-secondary rounded-2xl flex items-center justify-center">
                      <span className="font-serif text-6xl text-muted-foreground/10">S</span>
                    </div>
                  )}

                  {/* Bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Hover content */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.banho && (
                        <span className="font-sans text-[8px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border border-accent/30 text-accent/80">
                          {product.banho}
                        </span>
                      )}
                      {product.material && (
                        <span className="font-sans text-[8px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border border-foreground/20 text-foreground/60">
                          {product.material}
                        </span>
                      )}
                    </div>
                    <motion.a
                      href={whatsappLink(phone, product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-sans text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-full"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Interesse
                    </motion.a>
                  </div>

                  {/* Discount badge */}
                  {product.original_price && product.original_price > product.price && (
                    <div className="absolute top-4 left-4 bg-accent text-accent-foreground font-sans text-[9px] tracking-[0.12em] uppercase px-3 py-1 rounded-full">
                      -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                    </div>
                  )}
                </div>

                {/* Info below image */}
                <div className="mt-4 space-y-1.5">
                  {product.categories?.name && (
                    <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-accent/60">
                      {product.categories.name}
                    </p>
                  )}
                  <h3 className="font-serif text-lg md:text-xl text-foreground">{product.name}</h3>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-sans text-sm text-foreground">{fmt(product.price)}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="font-sans text-xs text-muted-foreground line-through">
                        {fmt(product.original_price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};

/* ─── Editorial single (asymmetric full-width) ─── */
const EditorialSingle = ({
  product,
  phone,
  reversed = false,
}: {
  product: any;
  phone: string;
  reversed?: boolean;
}) => {
  const img = product.foto_detalhe || product.foto_lateral || product.foto_frontal || product.images?.[0];
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-12">
      <div
        className={cn(
          "grid gap-6 md:gap-0 items-center",
          "md:grid-cols-[1fr_0.8fr]",
          reversed && "md:grid-cols-[0.8fr_1fr] md:[&>*:first-child]:order-2"
        )}
      >
        {/* Image */}
        <Reveal direction={reversed ? "right" : "left"}>
          <div className="relative aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden">
            {img ? (
              <ParallaxImage src={img} alt={product.name} className="absolute inset-0 rounded-2xl" />
            ) : (
              <div className="absolute inset-0 bg-secondary rounded-2xl flex items-center justify-center">
                <span className="font-serif text-8xl text-muted-foreground/10">S</span>
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-5 left-5 bg-accent text-accent-foreground font-sans text-[9px] tracking-[0.12em] uppercase px-3.5 py-1.5 rounded-full">
                -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
              </div>
            )}
          </div>
        </Reveal>

        {/* Content */}
        <div className={cn("flex flex-col justify-center py-6 md:py-0", reversed ? "md:pr-16 lg:pr-24" : "md:pl-16 lg:pl-24")}>
          {product.categories?.name && (
            <Reveal delay={0.1}>
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-4">
                {product.categories.name}
              </p>
            </Reveal>
          )}

          <Reveal delay={0.2}>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.05] mb-5">
              {product.name}
            </h2>
          </Reveal>

          {product.description && (
            <Reveal delay={0.3}>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6 max-w-md">
                {product.description}
              </p>
            </Reveal>
          )}

          {/* Specs */}
          <Reveal delay={0.35}>
            <div className="flex flex-wrap gap-2 mb-8">
              {product.material && (
                <span className="font-sans text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full border border-border text-muted-foreground">
                  {product.material}
                </span>
              )}
              {product.banho && (
                <span className="font-sans text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full border border-accent/30 text-accent/80">
                  {product.banho}
                </span>
              )}
              {product.pedra && (
                <span className="font-sans text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full border border-border text-muted-foreground">
                  {product.pedra}
                </span>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="flex items-baseline gap-3 mb-8">
              <span className="font-serif text-2xl md:text-3xl text-accent">
                {fmt(product.price)}
              </span>
              {hasDiscount && (
                <span className="font-sans text-sm text-muted-foreground line-through">
                  {fmt(product.original_price)}
                </span>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.45}>
            <div className="flex items-center gap-4">
              <motion.a
                href={whatsappLink(phone, product)}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, boxShadow: "0 0 40px hsl(39 41% 70% / 0.2)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase px-7 py-3.5 rounded-full"
              >
                <MessageCircle className="h-4 w-4" />
                Tenho interesse
              </motion.a>
              <Link
                to={`/produto/${product.id}`}
                className="font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                Detalhes
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* ─── Masonry-style grid for remaining products ─── */
const MasonryGrid = ({ products, phone }: { products: any[]; phone: string }) => {
  if (products.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-12">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
        {products.map((product, i) => {
          const img = product.foto_frontal || product.images?.[0];
          const isLarge = i % 5 === 0;
          const hasDiscount = product.original_price && product.original_price > product.price;

          return (
            <Reveal
              key={product.id}
              delay={Math.min(i * 0.08, 0.4)}
              className={cn(isLarge && "md:col-span-2 md:row-span-2")}
            >
              <motion.div
                layout
                className="group relative rounded-2xl overflow-hidden bg-card border border-border/30 h-full"
              >
                <div className={cn("relative overflow-hidden", isLarge ? "aspect-[4/5]" : "aspect-[3/4]")}>
                  {img ? (
                    <motion.img
                      src={img}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <span className="font-serif text-4xl text-muted-foreground/10">S</span>
                    </div>
                  )}

                  {/* Persistent bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 to-transparent" />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {hasDiscount && (
                    <div className="absolute top-3 left-3 bg-accent text-accent-foreground font-sans text-[9px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full">
                      -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                    </div>
                  )}

                  {/* Hover CTA */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <motion.a
                      href={whatsappLink(phone, product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 bg-accent text-accent-foreground font-sans text-[10px] tracking-[0.15em] uppercase px-5 py-2.5 rounded-full shadow-lg"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Interesse
                    </motion.a>
                  </div>

                  {/* Bottom info (always visible) */}
                  <div className="absolute bottom-0 inset-x-0 p-4 md:p-5">
                    <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-accent/70 mb-1">
                      {product.categories?.name || ""}
                    </p>
                    <h3 className="font-serif text-sm md:text-base text-foreground leading-tight mb-1.5 line-clamp-1">
                      {product.name}
                    </h3>
                    <span className="font-sans text-xs text-foreground/80">{fmt(product.price)}</span>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════
   LOOKBOOK PAGE
═══════════════════════════════════════════════════════ */
const LookbookPage = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("categoria") || undefined;
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCat);

  const { data: products, isLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();

  const phone = settings?.whatsapp_number || "";

  const filtered = activeCategory
    ? products?.filter((p: any) => p.categories?.slug === activeCategory)
    : products;

  // Layout strategy: 1st → full-bleed hero, 2nd+3rd → editorial single alternating, 4th+5th → duo, rest → masonry
  const heroProduct = filtered?.[0];
  const singleProducts = filtered?.slice(1, 3) || [];
  const duoProducts = filtered?.slice(3, 5) || [];
  const gridProducts = filtered?.slice(5) || [];

  // Available categories from featured products
  const productCategories = products
    ? [...new Set(products.map((p: any) => p.categories?.slug).filter(Boolean))]
    : [];
  const categoryNames = categories
    ? Object.fromEntries(categories.map((c) => [c.slug, c.name]))
    : {};

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Full-bleed hero ─── */}
      {!isLoading && heroProduct && (
        <HeroSpread product={heroProduct} phone={phone} />
      )}

      {/* ─── Brand statement + share + filters ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center">
          <Reveal>
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-accent mb-4">
              Curadoria Sollaris
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground mb-4">
              Peças que falam por si
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="font-sans text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6">
              Cada joia desta seleção foi escolhida com intenção. 
              Encontrou algo que combina com você? É só clicar.
            </p>
          </Reveal>

          {/* Share button */}
          <Reveal delay={0.25}>
            <ShareButton />
          </Reveal>

          {/* Category filters */}
          {productCategories.length > 1 && (
            <Reveal delay={0.3}>
              <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                <button
                  onClick={() => setActiveCategory(undefined)}
                  className={cn(
                    "font-sans text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-full border transition-all duration-400",
                    !activeCategory
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  Todas
                </button>
                {productCategories.map((slug) => (
                  <button
                    key={slug as string}
                    onClick={() => setActiveCategory(slug as string)}
                    className={cn(
                      "font-sans text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-full border transition-all duration-400",
                      activeCategory === slug
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    )}
                  >
                    {categoryNames[slug as string] || slug}
                  </button>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ─── Loading skeleton ─── */}
      {isLoading && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 space-y-12 pb-20">
          <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl bg-secondary animate-pulse" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-[3/4] rounded-2xl bg-secondary animate-pulse" />
            <div className="aspect-[3/4] rounded-2xl bg-secondary animate-pulse" />
          </div>
        </div>
      )}

      {/* ─── Editorial content ─── */}
      {!isLoading && filtered && filtered.length > 0 && (
        <div className="space-y-20 md:space-y-32 pb-20">
          {/* Single editorial spreads */}
          {singleProducts.map((product: any, i: number) => (
            <EditorialSingle
              key={product.id}
              product={product}
              phone={phone}
              reversed={i % 2 !== 0}
            />
          ))}

          {/* Interlude quote */}
          {duoProducts.length > 0 && (
            <Reveal className="max-w-[1400px] mx-auto px-6 md:px-12">
              <div className="relative py-12 md:py-16 text-center">
                <div className="gold-line max-w-[120px] mx-auto mb-8" />
                <p className="font-serif text-2xl md:text-3xl text-foreground/80 italic max-w-2xl mx-auto leading-relaxed">
                  "Toda joia carrega uma história. A sua começa aqui."
                </p>
                <div className="gold-line max-w-[120px] mx-auto mt-8" />
              </div>
            </Reveal>
          )}

          {/* Duo spread */}
          {duoProducts.length >= 2 && (
            <EditorialDuo products={duoProducts} phone={phone} />
          )}

          {/* Divider */}
          {gridProducts.length > 0 && (
            <Reveal className="max-w-[1400px] mx-auto px-6 md:px-12">
              <div className="flex items-center gap-6">
                <div className="gold-line flex-1" />
                <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-accent/50 whitespace-nowrap">
                  Mais peças selecionadas
                </span>
                <div className="gold-line flex-1" />
              </div>
            </Reveal>
          )}

          {/* Masonry grid for remaining */}
          <MasonryGrid products={gridProducts} phone={phone} />
        </div>
      )}

      {/* ─── Empty state ─── */}
      {!isLoading && (!filtered || filtered.length === 0) && (
        <div className="text-center py-24">
          <p className="font-sans text-sm text-muted-foreground">
            Nenhuma peça selecionada nesta categoria.
          </p>
        </div>
      )}

      {/* ─── Footer CTA ─── */}
      <Reveal>
        <section className="max-w-[1400px] mx-auto px-6 md:px-12 pb-24">
          <div className="relative rounded-3xl overflow-hidden bg-card border border-border/30">
            {/* Decorative S */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[200px] md:text-[300px] text-accent/[0.03] pointer-events-none select-none">
              S
            </div>
            <div className="relative text-center py-20 md:py-28 px-6 space-y-6">
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent/60">
                Atendimento exclusivo
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground">
                Ficou encantada?
              </h2>
              <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Chame a gente no WhatsApp. Ajudamos você a escolher a peça perfeita — 
                com atendimento personalizado e consultivo.
              </p>
              <div className="gold-line max-w-[100px] mx-auto" />
              {phone && (
                <motion.a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03, boxShadow: "0 0 50px hsl(39 41% 70% / 0.2)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase px-10 py-4 rounded-full"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </motion.a>
              )}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
};

export default LookbookPage;
