import { useState, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCategories, useSettings } from "@/hooks/useStore";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/store/ProductCard";
import { cn } from "@/lib/utils";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, X, ChevronDown, ArrowUpDown,
  Grid2X2, Grid3X3, LayoutGrid,
} from "lucide-react";

/* ─── helpers ─── */
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const SORT_OPTIONS = [
  { value: "recent", label: "Mais recentes" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "name-asc", label: "A → Z" },
  { value: "name-desc", label: "Z → A" },
] as const;

const PRICE_RANGES = [
  { label: "Todos", min: 0, max: Infinity },
  { label: "Até R$ 100", min: 0, max: 100 },
  { label: "R$ 100 – R$ 200", min: 100, max: 200 },
  { label: "R$ 200 – R$ 500", min: 200, max: 500 },
  { label: "Acima de R$ 500", min: 500, max: Infinity },
] as const;

/* ─── Reveal ─── */
const Reveal = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 25 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Filter Pill ─── */
const FilterPill = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "font-sans text-[10px] tracking-[0.15em] uppercase px-4 py-2 rounded-full border transition-all duration-300 whitespace-nowrap",
      active
        ? "border-accent text-accent bg-accent/10"
        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
    )}
  >
    {children}
  </button>
);

/* ─── Dropdown ─── */
const Dropdown = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-sans text-[10px] tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        {label}: <span className="text-foreground">{current?.label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-lg py-1.5 min-w-[160px]"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 font-sans text-[11px] tracking-[0.05em] transition-colors",
                    opt.value === value
                      ? "text-accent bg-accent/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   COLLECTION PAGE
═══════════════════════════════════════════════════════ */
const CollectionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get("categoria") || "";
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [priceRange, setPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState("recent");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);

  const { data: categories } = useCategories();
  const { data: settings } = useSettings();

  // Fetch ALL in-stock products
  const { data: allProducts, isLoading } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("stock_status", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Derived: filter + sort
  const filtered = useMemo(() => {
    if (!allProducts) return [];
    let result = [...allProducts];

    // Category filter
    if (activeCategory) {
      result = result.filter((p: any) => p.categories?.slug === activeCategory);
    }

    // Price filter
    const range = PRICE_RANGES[priceRange];
    if (range.max !== Infinity || range.min !== 0) {
      result = result.filter((p) => p.price >= range.min && p.price <= range.max);
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default: // recent — already sorted by created_at desc
        break;
    }

    return result;
  }, [allProducts, activeCategory, priceRange, sortBy]);

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    if (slug) {
      setSearchParams({ categoria: slug });
    } else {
      setSearchParams({});
    }
  };

  const activeFiltersCount = (activeCategory ? 1 : 0) + (priceRange > 0 ? 1 : 0);

  const clearFilters = () => {
    setActiveCategory("");
    setPriceRange(0);
    setSortBy("recent");
    setSearchParams({});
  };

  const pixDiscount = (settings as any)?.pix_discount_percent || 5;

  /* ─── Sidebar content (shared desktop + mobile) ─── */
  const FiltersContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-sans text-[10px] tracking-[0.25em] uppercase text-accent mb-4">
          Categorias
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => handleCategoryChange("")}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-xl font-sans text-sm transition-all duration-300",
              !activeCategory
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Todas as peças
            {allProducts && (
              <span className="ml-auto float-right text-[10px] text-muted-foreground">
                {allProducts.length}
              </span>
            )}
          </button>
          {categories?.map((cat) => {
            const count = allProducts?.filter((p: any) => p.categories?.slug === cat.slug).length || 0;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl font-sans text-sm transition-all duration-300",
                  activeCategory === cat.slug
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {cat.name}
                <span className="ml-auto float-right text-[10px] text-muted-foreground">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-sans text-[10px] tracking-[0.25em] uppercase text-accent mb-4">
          Faixa de preço
        </h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range, i) => (
            <button
              key={i}
              onClick={() => setPriceRange(i)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl font-sans text-sm transition-all duration-300",
                priceRange === i
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* PIX info */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mb-1.5">
          PIX com desconto
        </p>
        <p className="font-sans text-xs text-muted-foreground leading-relaxed">
          Todas as peças com <span className="text-accent font-medium">{pixDiscount}% de desconto</span> no pagamento via PIX.
        </p>
      </div>

      {/* Clear */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 font-sans text-[10px] tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero header ─── */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-sans text-[10px] tracking-[0.4em] uppercase text-accent mb-3"
          >
            Curadoria Sollaris
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4"
          >
            Coleção
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-sans text-sm text-muted-foreground max-w-md mx-auto"
          >
            Explore todas as peças da nossa curadoria. Cada joia conta uma história.
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="gold-line max-w-[160px] mx-auto mt-6"
          />
        </div>
      </section>

      {/* ─── Mobile filter bar ─── */}
      <div className="md:hidden max-w-[1400px] mx-auto px-6 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 font-sans text-[10px] tracking-[0.12em] uppercase text-muted-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-accent text-accent-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <Dropdown
            label="Ordenar"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
          />
        </div>

        {/* Mobile category pills */}
        <div className="flex gap-2 overflow-x-auto mt-4 pb-2 scrollbar-hide">
          <FilterPill active={!activeCategory} onClick={() => handleCategoryChange("")}>
            Todas
          </FilterPill>
          {categories?.map((cat) => (
            <FilterPill
              key={cat.id}
              active={activeCategory === cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
            >
              {cat.name}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* ─── Mobile filter drawer ─── */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 w-[300px] bg-card border-r border-border z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-xl text-foreground">Filtros</h2>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <FiltersContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main layout ─── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-24">
        <div className="flex gap-12 lg:gap-16">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-[220px] lg:w-[240px] flex-shrink-0">
            <div className="sticky top-24">
              <FiltersContent />
            </div>
          </aside>

          {/* Product grid area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="hidden md:flex items-center justify-between mb-8">
              <p className="font-sans text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "peça" : "peças"}
                {activeCategory && categories && (
                  <> em <span className="text-foreground">{categories.find(c => c.slug === activeCategory)?.name}</span></>
                )}
              </p>
              <div className="flex items-center gap-6">
                {/* Grid toggle */}
                <div className="flex items-center gap-1 border border-border rounded-full p-1">
                  {([2, 3, 4] as const).map((cols) => {
                    const Icon = cols === 2 ? Grid2X2 : cols === 3 ? Grid3X3 : LayoutGrid;
                    return (
                      <button
                        key={cols}
                        onClick={() => setGridCols(cols)}
                        className={cn(
                          "p-1.5 rounded-full transition-colors",
                          gridCols === cols ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
                <Dropdown
                  label="Ordenar"
                  value={sortBy}
                  options={SORT_OPTIONS}
                  onChange={setSortBy}
                />
              </div>
            </div>

            {/* Active filter tags */}
            {activeFiltersCount > 0 && (
              <div className="hidden md:flex items-center gap-2 mb-6">
                {activeCategory && categories && (
                  <span className="inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.1em] uppercase bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                    {categories.find(c => c.slug === activeCategory)?.name}
                    <button onClick={() => handleCategoryChange("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {priceRange > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.1em] uppercase bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                    {PRICE_RANGES[priceRange].label}
                    <button onClick={() => setPriceRange(0)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="font-sans text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors ml-2"
                >
                  Limpar tudo
                </button>
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div className={cn(
                "grid gap-x-5 gap-y-8",
                gridCols === 2 && "grid-cols-2",
                gridCols === 3 && "grid-cols-2 md:grid-cols-3",
                gridCols === 4 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
              )}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] rounded-2xl bg-secondary animate-pulse" />
                    <div className="h-2.5 w-16 bg-secondary animate-pulse rounded" />
                    <div className="h-3.5 w-2/3 bg-secondary animate-pulse rounded" />
                    <div className="h-3 w-1/3 bg-secondary animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <motion.div
                layout
                className={cn(
                  "grid gap-x-5 gap-y-8",
                  gridCols === 2 && "grid-cols-2",
                  gridCols === 3 && "grid-cols-2 md:grid-cols-3",
                  gridCols === 4 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                )}
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((product, i) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
                    >
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
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-24">
                <div className="font-serif text-5xl text-muted-foreground/10 mb-4">∅</div>
                <p className="font-sans text-sm text-muted-foreground mb-4">
                  Nenhuma peça encontrada com esses filtros.
                </p>
                <button
                  onClick={clearFilters}
                  className="font-sans text-[11px] tracking-[0.15em] uppercase text-accent hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;
