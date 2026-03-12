import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { MessageCircle, Filter, X, ChevronDown, Sparkles } from "lucide-react";
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

/* ─── animated section wrapper ─── */
const Reveal = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── hero product card (large, editorial) ─── */
const HeroCard = ({
  product,
  phone,
  index,
}: {
  product: any;
  phone: string;
  index: number;
}) => {
  const isEven = index % 2 === 0;
  const img = product.foto_frontal || product.foto_lifestyle || product.images?.[0];
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <Reveal delay={0.1}>
      <div
        className={cn(
          "grid gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card",
          "md:grid-cols-2",
          !isEven && "md:[&>*:first-child]:order-2"
        )}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] md:aspect-auto overflow-hidden group">
          {img ? (
            <motion.img
              src={img}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <span className="font-serif text-6xl text-muted-foreground/15">S</span>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-4 left-4 bg-accent text-accent-foreground font-sans text-[10px] tracking-[0.15em] uppercase px-4 py-1.5 rounded-full">
              -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
            </div>
          )}

          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 space-y-6">
          {product.categories?.name && (
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="font-sans text-[10px] tracking-[0.3em] uppercase text-accent"
            >
              {product.categories.name}
            </motion.p>
          )}

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight"
          >
            {product.name}
          </motion.h2>

          {product.description && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-sans text-sm text-muted-foreground leading-relaxed line-clamp-3"
            >
              {product.description}
            </motion.p>
          )}

          {/* Details chips */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex flex-wrap gap-2"
          >
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
          </motion.div>

          {/* Price */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-baseline gap-3"
          >
            <span className="font-serif text-2xl md:text-3xl text-accent">
              {fmt(product.price)}
            </span>
            {hasDiscount && (
              <span className="font-sans text-sm text-muted-foreground line-through">
                {fmt(product.original_price)}
              </span>
            )}
          </motion.div>

          {/* Gold divider */}
          <div className="gold-line w-full" />

          {/* CTA */}
          <motion.a
            href={whatsappLink(phone, product)}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-3 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-full w-fit transition-shadow hover:shadow-[0_0_30px_hsl(var(--accent)/0.25)]"
          >
            <MessageCircle className="h-4 w-4" />
            Tenho interesse
          </motion.a>
        </div>
      </div>
    </Reveal>
  );
};

/* ─── compact card (for grid) ─── */
const CompactCard = ({ product, phone }: { product: any; phone: string }) => {
  const img = product.foto_frontal || product.images?.[0];
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-2xl border border-border/50 bg-card overflow-hidden"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {img ? (
          <motion.img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.7 }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="font-serif text-4xl text-muted-foreground/15">S</span>
          </div>
        )}

        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-accent text-accent-foreground font-sans text-[9px] tracking-[0.1em] uppercase px-3 py-1 rounded-full">
            -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
          </div>
        )}

        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
          <motion.a
            href={whatsappLink(phone, product)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-accent text-accent-foreground font-sans text-[10px] tracking-[0.18em] uppercase px-6 py-3 rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Interesse
          </motion.a>
        </div>
      </div>

      <div className="p-5 space-y-2">
        {product.categories?.name && (
          <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-accent/70">
            {product.categories.name}
          </p>
        )}
        <h3 className="font-sans text-sm text-foreground leading-snug">{product.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-sm font-medium text-foreground">{fmt(product.price)}</span>
          {hasDiscount && (
            <span className="font-sans text-[11px] text-muted-foreground line-through">
              {fmt(product.original_price)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════
   LOOKBOOK PAGE
═══════════════════════════════════════════════ */
const LookbookPage = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("categoria") || undefined;
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCat);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();

  const phone = settings?.whatsapp_number || "";

  // Filter products by category
  const filtered = activeCategory
    ? products?.filter((p: any) => p.categories?.slug === activeCategory)
    : products;

  // Split: first 2 as hero, rest as grid
  const heroProducts = filtered?.slice(0, 2) || [];
  const gridProducts = filtered?.slice(2) || [];

  // Get unique categories from featured products
  const productCategories = products
    ? [...new Set(products.map((p: any) => p.categories?.slug).filter(Boolean))]
    : [];

  const categoryNames = categories
    ? Object.fromEntries(categories.map((c) => [c.slug, c.name]))
    : {};

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero header ─── */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
            <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent">
              Curadoria Sollaris
            </span>
            <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground mb-6"
          >
            Lookbook
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-sans text-sm text-muted-foreground max-w-md mx-auto leading-relaxed"
          >
            Peças selecionadas a dedo para você. Encontrou algo especial? É só clicar e falar com a gente.
          </motion.p>

          {/* Gold divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="gold-line max-w-[200px] mx-auto mt-8"
          />
        </div>
      </section>

      {/* ─── Filter bar ─── */}
      {productCategories.length > 1 && (
        <section className="max-w-[1200px] mx-auto px-6 mb-12">
          <Reveal>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setActiveCategory(undefined)}
                className={cn(
                  "font-sans text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-full border transition-all duration-300",
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
                    "font-sans text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-full border transition-all duration-300",
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
        </section>
      )}

      {/* ─── Loading ─── */}
      {isLoading && (
        <div className="max-w-[1200px] mx-auto px-6 space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-border/30">
              <div className="aspect-[3/4] md:aspect-auto bg-secondary animate-pulse" />
              <div className="p-12 space-y-4">
                <div className="h-3 w-20 bg-secondary animate-pulse rounded" />
                <div className="h-8 w-2/3 bg-secondary animate-pulse rounded" />
                <div className="h-4 w-full bg-secondary animate-pulse rounded" />
                <div className="h-6 w-1/3 bg-secondary animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Content ─── */}
      {!isLoading && filtered && filtered.length > 0 && (
        <>
          {/* Hero editorial cards */}
          <section className="max-w-[1200px] mx-auto px-6 space-y-10 mb-16">
            {heroProducts.map((product: any, i: number) => (
              <HeroCard key={product.id} product={product} phone={phone} index={i} />
            ))}
          </section>

          {/* Interlude divider */}
          {gridProducts.length > 0 && (
            <Reveal className="max-w-[1200px] mx-auto px-6 mb-16">
              <div className="flex items-center gap-6">
                <div className="gold-line flex-1" />
                <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-accent/60 whitespace-nowrap">
                  Mais peças
                </span>
                <div className="gold-line flex-1" />
              </div>
            </Reveal>
          )}

          {/* Compact grid */}
          {gridProducts.length > 0 && (
            <section className="max-w-[1200px] mx-auto px-6 mb-20">
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className="grid grid-cols-2 md:grid-cols-3 gap-5"
                >
                  {gridProducts.map((product: any) => (
                    <CompactCard key={product.id} product={product} phone={phone} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </section>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && (!filtered || filtered.length === 0) && (
        <div className="text-center py-24">
          <p className="font-sans text-sm text-muted-foreground">
            Nenhuma peça selecionada nesta categoria.
          </p>
        </div>
      )}

      {/* ─── Footer CTA ─── */}
      <Reveal>
        <section className="max-w-[1200px] mx-auto px-6 pb-20">
          <div className="text-center space-y-6 py-16 border-t border-border/50">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-accent/60">
              Atendimento personalizado
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              Ficou com alguma dúvida?
            </h2>
            <p className="font-sans text-sm text-muted-foreground max-w-sm mx-auto">
              Chame a gente no WhatsApp. Ajudamos você a escolher a peça perfeita.
            </p>
            {phone && (
              <motion.a
                href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-full transition-shadow hover:shadow-[0_0_30px_hsl(var(--accent)/0.2)]"
              >
                <MessageCircle className="h-4 w-4" />
                Falar no WhatsApp
              </motion.a>
            )}
          </div>
        </section>
      </Reveal>
    </div>
  );
};

export default LookbookPage;
