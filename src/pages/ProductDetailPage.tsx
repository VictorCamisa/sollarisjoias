import { useParams, Link } from "react-router-dom";
import { useProduct, useSettings, useFeaturedProducts } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, MessageCircle, ChevronLeft, ChevronRight, ZoomIn, Share2, Check, Heart, ShoppingBag, Minus, Plus } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] rounded-2xl bg-secondary flex items-center justify-center">
        <span className="font-serif text-6xl text-muted-foreground/10">S</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary group cursor-zoom-in"
          onClick={() => setZooming(true)}
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
            />
          </AnimatePresence>

          {/* Zoom hint */}
          <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ZoomIn className="h-4 w-4 text-foreground" strokeWidth={1.5} />
          </div>

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background/80"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background/80"
              >
                <ChevronRight className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/60 backdrop-blur-md rounded-full px-3 py-1.5 font-sans text-[10px] tracking-[0.1em] text-foreground/80">
              {current + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

/* ═══════════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
═══════════════════════════════════════════════════════ */
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-20 md:pt-24">
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 font-sans text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-8 md:mb-12"
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-20">
          {/* Left: Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <ImageGallery images={images} productName={product.name} />
          </motion.div>

          {/* Right: Product info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col py-2 md:py-8 md:sticky md:top-20 md:self-start"
          >
            {/* Category */}
            {(product.categories as any)?.name && (
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-3">
                {(product.categories as any).name}
              </p>
            )}

            {/* Name */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.05] mb-6">
              {product.name}
            </h1>

            {/* Price block */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-1.5">
                <span className="font-serif text-2xl md:text-3xl text-accent">
                  {fmt(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="font-sans text-sm text-muted-foreground line-through">
                      {fmt(product.original_price!)}
                    </span>
                    <span className="font-sans text-[10px] tracking-[0.1em] uppercase bg-accent/15 text-accent px-2.5 py-1 rounded-full">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
              <p className="font-sans text-xs text-muted-foreground">
                ou <span className="text-accent">{fmt(pixPrice)}</span> no PIX
              </p>
            </div>

            {/* Gold divider */}
            <div className="gold-line w-full mb-6" />

            {/* Description */}
            {product.description && (
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-8 max-w-lg">
                {product.description}
              </p>
            )}

            {/* Specs */}
            {details.length > 0 && (
              <div className="space-y-0 mb-8 rounded-xl border border-border/50 overflow-hidden">
                {details.map((d, i) => (
                  <div
                    key={d.label}
                    className={cn(
                      "flex justify-between items-center px-5 py-3.5",
                      i < details.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                      {d.label}
                    </span>
                    <span className="font-sans text-sm text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity + Cart */}
            <div className="space-y-3 mb-6">
              {/* Quantity selector */}
              <div className="flex items-center gap-4">
                <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  Quantidade
                </span>
                <div className="flex items-center border border-border rounded-full">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-sans text-sm text-foreground w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <motion.button
                onClick={handleAddToCart}
                disabled={!product.stock_status}
                whileHover={{ scale: product.stock_status ? 1.01 : 1 }}
                whileTap={{ scale: product.stock_status ? 0.98 : 1 }}
                className={cn(
                  "w-full h-14 rounded-full font-sans text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all duration-300",
                  product.stock_status
                    ? "bg-accent text-accent-foreground hover:shadow-[0_0_40px_hsl(var(--accent)/0.2)]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-4 w-4" />
                    Adicionado!
                  </>
                ) : product.stock_status ? (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Adicionar à Sacola
                  </>
                ) : (
                  "Esgotado"
                )}
              </motion.button>

              {/* WhatsApp CTA */}
              {phone && (
                <motion.a
                  href={whatsappLink(phone, product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 rounded-full border border-accent/30 font-sans text-[11px] tracking-[0.15em] uppercase text-accent flex items-center justify-center gap-3 hover:bg-accent/5 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Perguntar no WhatsApp
                </motion.a>
              )}
            </div>

            {/* Share + SKU */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 font-sans text-[10px] tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                {copied ? "Link copiado!" : "Compartilhar"}
              </button>
              {product.sku && (
                <span className="font-sans text-[10px] text-muted-foreground/50">
                  REF: {product.sku}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Related Products ─── */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-12 pb-24">
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
    </div>
  );
};

export default ProductDetailPage;
