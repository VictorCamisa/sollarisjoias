import { useParams, Link } from "react-router-dom";
import { useProduct, useSettings, useFeaturedProducts } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, MessageCircle, ChevronLeft, ChevronRight, ZoomIn, Share2, Check, Heart, ShoppingBag, Minus, Plus, ShieldCheck, Truck, Gem, Sparkles, RotateCcw, Award, Lock } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

/* ─── helpers ─── */
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const whatsappLink = (phone: string, product: { name: string; price: number; id: string }) => {
  const msg = encodeURIComponent(
    `Olá! Tenho interesse na peça *${product.name}* (${fmt(product.price)}).\n${window.location.origin}/produto/${product.id}`
  );
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`;
};

/* ─── Reveal animation ─── */
const Reveal = ({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Zoom Modal ─── */
const ZoomModal = ({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center cursor-zoom-out"
      onClick={onClose}
    >
      <div
        className="w-full h-full overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <motion.img
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          src={src}
          alt={alt}
          className="w-full h-full object-contain pointer-events-none"
          style={{
            transformOrigin: `${position.x}% ${position.y}%`,
            transform: "scale(1.8)",
          }}
        />
      </div>
    </motion.div>
  );
};

/* ─── Image Gallery ─── */
const ImageGallery = ({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) => {
  const [current, setCurrent] = useState(0);
  const [zooming, setZooming] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(
    () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)),
    [images.length]
  );
  const next = useCallback(
    () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)),
    [images.length]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      dx > 0 ? prev() : next();
    }
    touchStartX.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] md:aspect-[3/4] rounded-2xl bg-secondary flex items-center justify-center">
        <span className="font-serif text-6xl text-muted-foreground/10">S</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2.5 md:space-y-3">
        {/* Main image — 4:5 mobile (mais compacto), 3:4 desktop */}
        <div
          className="relative aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden bg-secondary group cursor-zoom-in select-none"
          onClick={() => setZooming(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={images[current]}
              alt={`${productName} - Foto ${current + 1}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </AnimatePresence>

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 bg-background/60 backdrop-blur-md rounded-full p-2 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <ZoomIn className="h-3.5 w-3.5 text-foreground" strokeWidth={1.5} />
          </div>

          {/* Nav arrows — desktop only */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 bg-background/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background/80 items-center justify-center"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 bg-background/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background/80 items-center justify-center"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Image counter / dots — mobile dots, desktop counter */}
          {images.length > 1 && (
            <>
              <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/60 backdrop-blur-md rounded-full px-3 py-1.5 font-sans text-[10px] tracking-[0.1em] text-foreground/80">
                {current + 1} / {images.length}
              </div>
              <div className="md:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === current ? "w-6 bg-accent" : "w-1 bg-foreground/40"
                    )}
                    aria-label={`Imagem ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails — desktop only */}
        {images.length > 1 && (
          <div className="hidden md:flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-16 h-20 md:w-20 md:h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300",
                  i === current
                    ? "border-accent shadow-[0_0_12px_hsl(var(--accent)/0.2)]"
                    : "border-transparent opacity-50 hover:opacity-80"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom modal */}
      <AnimatePresence>
        {zooming && images[current] && (
          <ZoomModal
            src={images[current]}
            alt={productName}
            onClose={() => setZooming(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Related Product Card ─── */
const RelatedCard = ({ product }: { product: any }) => {
  const img = product.foto_frontal || product.images?.[0];
  return (
    <Link to={`/produto/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary mb-3">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-3xl text-muted-foreground/10">S</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 to-transparent" />
      </div>
      <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-accent/60 mb-0.5">
        {product.categories?.name || ""}
      </p>
      <h4 className="font-serif text-sm text-foreground group-hover:text-accent transition-colors line-clamp-1">
        {product.name}
      </h4>
      <span className="font-sans text-xs text-muted-foreground">{fmt(product.price)}</span>
    </Link>
  );
};

/* ─── Product Info Tabs (Descrição, Especificações, Cuidados, Frete) ─── */
const ProductInfoTabs = ({ product }: { product: any }) => {
  const [active, setActive] = useState<"desc" | "specs" | "care" | "shipping">("desc");

  const specs = [
    { label: "Material", value: product.material },
    { label: "Banho", value: product.banho },
    { label: "Pedra", value: product.pedra },
    { label: "Peso", value: product.weight_g ? `${product.weight_g}g` : null },
    { label: "Referência (SKU)", value: product.sku },
    { label: "Tamanhos disponíveis", value: product.sizes?.length ? product.sizes.join(", ") : null },
    { label: "Cores", value: product.colors?.length ? product.colors.join(", ") : null },
  ].filter((s) => s.value);

  const tabs = [
    { id: "desc" as const, label: "Descrição" },
    { id: "specs" as const, label: "Especificações" },
    { id: "care" as const, label: "Cuidados" },
    { id: "shipping" as const, label: "Frete & Devolução" },
  ];

  return (
    <div className="mt-16 md:mt-24 border-t border-border/40 pt-10">
      {/* Tab triggers */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "relative px-4 sm:px-6 py-3 font-sans text-[10px] sm:text-[11px] tracking-[0.18em] uppercase whitespace-nowrap transition-colors",
              active === t.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {active === t.id && (
              <motion.span
                layoutId="tab-underline"
                className="absolute left-0 right-0 bottom-0 h-px bg-accent"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          {active === "desc" && (
            <div className="space-y-4">
              <p className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed">
                {product.description ||
                  "Cada peça SOLLARIS é selecionada com intenção. Curadoria silenciosa, design atemporal e acabamento que resiste ao tempo — para mulheres que escolhem com propósito."}
              </p>
              <div className="flex items-center gap-3 pt-2 text-accent">
                <Gem className="h-4 w-4" strokeWidth={1.5} />
                <span className="font-sans text-[10px] tracking-[0.25em] uppercase">
                  Curadoria com intenção
                </span>
              </div>
            </div>
          )}

          {active === "specs" && (
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-0">
              {specs.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground">Especificações em atualização.</p>
              ) : (
                specs.map((s, i) => (
                  <div
                    key={s.label}
                    className={cn(
                      "flex justify-between items-center py-3.5 border-b border-border/30",
                      i >= specs.length - 2 && "sm:border-b-0"
                    )}
                  >
                    <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                      {s.label}
                    </span>
                    <span className="font-sans text-sm text-foreground text-right">{s.value}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {active === "care" && (
            <div className="space-y-5 font-sans text-sm text-muted-foreground leading-relaxed">
              <p>
                Para preservar o brilho e prolongar a vida da sua peça SOLLARIS, siga
                cuidados simples — joias respondem ao carinho diário.
              </p>
              <ul className="space-y-3">
                {[
                  "Evite contato com perfumes, cremes, álcool e produtos de limpeza.",
                  "Retire ao dormir, praticar exercícios ou entrar no mar/piscina.",
                  "Limpe com flanela seca após o uso — nunca use água quente.",
                  "Guarde em local seco, separada de outras peças, na embalagem original.",
                ].map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <Sparkles className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-1" strokeWidth={1.5} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {active === "shipping" && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/40 p-5 bg-secondary/20">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Truck className="h-4 w-4 text-accent" strokeWidth={1.5} />
                    <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-foreground">
                      Envio para todo o Brasil
                    </span>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Calculamos o frete por CEP no checkout. <span className="text-accent">Frete grátis</span> em
                    pedidos acima de R$ 500. Embalagem premium incluída.
                  </p>
                </div>
                <div className="rounded-xl border border-border/40 p-5 bg-secondary/20">
                  <div className="flex items-center gap-2.5 mb-2">
                    <RotateCcw className="h-4 w-4 text-accent" strokeWidth={1.5} />
                    <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-foreground">
                      Trocas em até 7 dias
                    </span>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Você tem 7 dias corridos após o recebimento para solicitar troca,
                    conforme Código de Defesa do Consumidor. Peça deve estar sem uso.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-foreground mb-1">
                    Garantia SOLLARIS — 6 meses
                  </p>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                    Cobrimos defeitos de fabricação no banho e na estrutura. Falamos
                    diretamente pelo WhatsApp para resolver com agilidade.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: settings } = useSettings();
  const { data: featuredProducts } = useFeaturedProducts();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const phone = settings?.whatsapp_number || "";

  // Track view_product
  useEffect(() => {
    if (product?.id) {
      trackEvent("view_product", {
        productId: product.id,
        productName: (product as any).name,
        metadata: { price: (product as any).price },
      }).catch(() => {});
    }
  }, [product?.id]);


  // Related products (same category, excluding current)
  const relatedProducts = featuredProducts
    ?.filter((p: any) => p.id !== id && p.categories?.slug === (product as any)?.categories?.slug)
    .slice(0, 4) || [];

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-20 sm:pt-24 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">
          <div className="aspect-[3/4] rounded-2xl bg-secondary animate-pulse" />
          <div className="space-y-6 py-12">
            <div className="h-3 w-20 bg-secondary animate-pulse rounded" />
            <div className="h-10 w-3/4 bg-secondary animate-pulse rounded" />
            <div className="h-5 w-1/3 bg-secondary animate-pulse rounded" />
            <div className="h-20 w-full bg-secondary animate-pulse rounded" />
            <div className="h-14 w-full bg-secondary animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-32 text-center">
        <div className="font-serif text-6xl text-muted-foreground/10 mb-6">404</div>
        <p className="font-sans text-sm text-muted-foreground mb-4">Produto não encontrado.</p>
        <Link
          to="/colecao"
          className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.15em] uppercase text-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar à coleção
        </Link>
      </div>
    );
  }

  const images = [
    product.foto_frontal,
    product.foto_lateral,
    product.foto_detalhe,
    product.foto_lifestyle,
    ...(product.images || []),
  ].filter(Boolean) as string[];

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const details = [
    { label: "Material", value: product.material },
    { label: "Banho", value: product.banho },
    { label: "Pedra", value: product.pedra },
    { label: "Peso", value: product.weight_g ? `${product.weight_g}g` : null },
  ].filter((d) => d.value);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: images[0] || null,
      });
    }
    setAddedToCart(true);
    toast.success(`${product.name} adicionado à sacola`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/produto/${product.id}`;
    const text = `Olha essa peça da SOLLARIS: *${product.name}* — ${fmt(product.price)}`;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const pixPrice = product.price * (1 - ((settings as any)?.pix_discount_percent || 5) / 100);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Breadcrumb ─── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-3 sm:pt-6 md:pt-12">
        {/* Mobile: compact back link */}
        <Link
          to="/colecao"
          className="md:hidden inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar à coleção
        </Link>

        {/* Desktop: full breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex items-center gap-2 font-sans text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-8 md:mb-12"
        >
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="text-border">/</span>
          <Link to="/colecao" className="hover:text-foreground transition-colors">Coleção</Link>
          {(product.categories as any)?.name && (
            <>
              <span className="text-border">/</span>
              <span className="text-foreground/60">{(product.categories as any).name}</span>
            </>
          )}
        </motion.nav>
      </div>

      {/* ─── Main content ─── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pb-20 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-20">
          {/* Left: Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <ImageGallery images={images} productName={product.name} />
          </motion.div>

          {/* Right: Product info — sticky on desktop */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col py-2 md:py-6 md:sticky md:top-20 md:self-start"
          >
            {/* Category */}
            {(product.categories as any)?.name && (
              <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-accent mb-2.5">
                {(product.categories as any).name}
              </p>
            )}

            {/* Name */}
            <h1 className="font-serif text-[26px] sm:text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.05] mb-4 md:mb-5">
              {product.name}
            </h1>

            {/* Sales triggers — compact horizontal row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {product.stock_quantity != null && product.stock_quantity > 0 && product.stock_quantity <= 3 && (
                <span className="inline-flex items-center gap-1.5 font-sans text-[9.5px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full bg-warning/15 text-warning border border-warning/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-warning" />
                  </span>
                  {product.stock_quantity === 1 ? "Última peça" : `Restam ${product.stock_quantity}`}
                </span>
              )}
              {product.is_featured && (
                <span className="inline-flex items-center gap-1.5 font-sans text-[9.5px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                  <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
                  Mais procurado
                </span>
              )}
              {product.price >= 500 && (
                <span className="inline-flex items-center gap-1.5 font-sans text-[9.5px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
                  <Truck className="h-2.5 w-2.5" strokeWidth={2} />
                  Frete grátis
                </span>
              )}
            </div>

            {/* Price block — main commercial focus */}
            <div className="mb-5 md:mb-6">
              <div className="flex items-baseline flex-wrap gap-2.5 mb-2">
                <span className="font-serif text-[28px] sm:text-3xl md:text-4xl text-foreground tabular-nums leading-none">
                  {fmt(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="font-sans text-xs sm:text-sm text-muted-foreground line-through tabular-nums">
                      {fmt(product.original_price!)}
                    </span>
                    <span className="font-sans text-[9.5px] tracking-[0.12em] uppercase bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                      −{discountPercent}%
                    </span>
                  </>
                )}
              </div>
              <div className="space-y-0.5">
                <p className="font-sans text-[13px] text-foreground tabular-nums">
                  ou <span className="text-accent font-medium">{fmt(pixPrice)}</span>{" "}
                  <span className="text-muted-foreground">à vista no Pix</span>
                </p>
                <p className="font-sans text-[12px] text-muted-foreground tabular-nums">
                  até <span className="text-foreground">4× {fmt(product.price / 4)}</span> sem juros
                </p>
              </div>
            </div>

            {/* Quantity + CTAs */}
            <div className="space-y-2.5 mb-5">
              {/* Quantity selector */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                  Quantidade
                </span>
                <div className="flex items-center border border-border rounded-full">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                    aria-label="Diminuir"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-sans text-sm text-foreground w-8 text-center tabular-nums">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                    aria-label="Aumentar"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Add to cart — primary */}
              <motion.button
                onClick={handleAddToCart}
                disabled={!product.stock_status}
                whileTap={{ scale: product.stock_status ? 0.98 : 1 }}
                className={cn(
                  "w-full h-13 sm:h-14 rounded-full font-sans text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all duration-300 py-4",
                  product.stock_status
                    ? "bg-accent text-accent-foreground hover:shadow-[0_0_40px_hsl(var(--accent)/0.25)]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-4 w-4" />
                    Adicionado
                  </>
                ) : product.stock_status ? (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Adicionar à sacola
                  </>
                ) : (
                  "Esgotado"
                )}
              </motion.button>

              {/* WhatsApp CTA — secondary */}
              {phone && (
                <a
                  href={whatsappLink(phone, product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full border border-border font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent hover:border-accent/40 active:scale-[0.98] flex items-center justify-center gap-2.5 transition-all"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Falar no WhatsApp
                </a>
              )}
            </div>

            {/* ─── Trust strip — compact horizontal ─── */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/40">
              {[
                { icon: ShieldCheck, label: "Garantia 6m" },
                { icon: Truck, label: "Envio rápido" },
                { icon: RotateCcw, label: "Troca 7 dias" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1">
                  <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                  <span className="font-sans text-[9.5px] tracking-[0.08em] uppercase text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Share + SKU */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 font-sans text-[10px] tracking-[0.12em] uppercase text-muted-foreground hover:text-accent transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Compartilhar"}
              </button>
              {product.sku && (
                <span className="font-sans text-[10px] text-muted-foreground/50 tabular-nums">
                  REF {product.sku}
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* ─── Structured info tabs ─── */}
        <Reveal>
          <ProductInfoTabs product={product} />
        </Reveal>
      </div>

      {/* ─── Related Products ─── */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pb-24 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-24">
          <Reveal>
            <div className="gold-line w-full mb-12" />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                Você também vai amar
              </h2>
              <Link
                to="/colecao"
                className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors"
              >
                Ver tudo →
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p: any, i: number) => (
              <Reveal key={p.id} delay={0.1 + i * 0.08}>
                <RelatedCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ─── Sticky CTA mobile ─── */}
      {product.stock_status && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] flex items-center gap-3 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.5)]">
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[9px] tracking-[0.18em] uppercase text-muted-foreground leading-tight">
              Total
            </p>
            <p className="font-serif text-[17px] text-foreground tabular-nums leading-tight">
              {fmt(product.price * quantity)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className="h-12 px-6 bg-accent text-accent-foreground font-sans text-[10px] tracking-[0.18em] uppercase rounded-full flex items-center gap-2 active:scale-95 transition-transform whitespace-nowrap shadow-lg"
          >
            {addedToCart ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {addedToCart ? "Adicionado" : "Adicionar"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
