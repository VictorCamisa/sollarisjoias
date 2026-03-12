import { useParams, Link } from "react-router-dom";
import { useProduct } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import logoSollaris from "@/assets/logo-sollaris.png";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || "");
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[3/4] bg-secondary animate-pulse" />
          <div className="space-y-4 py-8">
            <div className="h-3 w-1/3 bg-secondary animate-pulse" />
            <div className="h-6 w-2/3 bg-secondary animate-pulse" />
            <div className="h-4 w-1/4 bg-secondary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <p className="font-sans text-sm text-muted-foreground">Produto não encontrado.</p>
        <Link to="/colecao" className="font-sans text-sm text-accent mt-4 inline-block">
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

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0] || null,
    });
  };

  const details = [
    { label: "Material", value: product.material },
    { label: "Banho", value: product.banho },
    { label: "Pedra", value: product.pedra },
    { label: "Peso", value: product.weight_g ? `${product.weight_g}g` : null },
  ].filter((d) => d.value);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Back */}
      <Link
        to="/colecao"
        className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-10"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Voltar
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Images */}
        <div className="space-y-3">
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="aspect-[3/4] bg-secondary overflow-hidden"
          >
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-4xl text-muted-foreground/20 tracking-[0.1em]">S</span>
              </div>
            )}
          </motion.div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 flex-shrink-0 bg-secondary overflow-hidden border transition-colors ${
                    i === selectedImage ? "border-accent" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center py-4">
          {(product.categories as any)?.name && (
            <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
              {(product.categories as any).name}
            </p>
          )}

          <h1 className="font-serif text-display-sm text-foreground mb-4">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 mb-8">
            <span className="font-sans text-xl text-foreground">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="font-sans text-sm text-muted-foreground line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">
              {product.description}
            </p>
          )}

          {/* Details */}
          {details.length > 0 && (
            <div className="border-t border-border pt-6 mb-8 space-y-3">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between">
                  <span className="font-sans text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
                    {d.label}
                  </span>
                  <span className="font-sans text-sm text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!product.stock_status}
            className="w-full max-w-sm h-13 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {product.stock_status ? "Adicionar à Sacola" : "Esgotado"}
          </button>

          {product.sku && (
            <p className="font-sans text-[10px] text-muted-foreground mt-4">
              REF: {product.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
