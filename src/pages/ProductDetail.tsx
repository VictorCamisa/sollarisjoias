import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import ShareButton from "@/components/store/ShareButton";
import FavoriteButton from "@/components/store/FavoriteButton";
import SEOHead from "@/components/seo/SEOHead";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <div className="pt-24 pb-16 container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="aspect-[3/4] rounded-2xl" />
          <div className="space-y-4 pt-8">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24 pb-16 container mx-auto px-6 text-center">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link to="/produtos" className="text-sm underline mt-4 inline-block">
          Voltar à coleção
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const sizes = product.sizes || [];
  const colors = product.colors || [];

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Selecione um tamanho");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error("Selecione uma cor");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize || "Único",
      color: selectedColor || "Padrão",
      quantity: 1,
      image: images[0] || "",
    });

    toast.success("Adicionado ao carrinho!");
  };

  return (
    <div className="pt-24 pb-16">
      <SEOHead
        title={`${product.name} — LARIFA`}
        description={product.description || `${product.name} por R$ ${product.price.toFixed(2).replace(".", ",")}`}
        image={images[0]}
      />
      <div className="container mx-auto px-6">
        <Link
          to="/produtos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-8"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="aspect-[3/4] rounded-2xl bg-secondary overflow-hidden mb-3">
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-secondary" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                      selectedImage === i ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="pt-4"
          >
            {(product.categories as any)?.name && (
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2 font-sans">
                {(product.categories as any).name}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-3">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold mb-6">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </p>

            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3 font-sans font-medium">
                  Tamanho
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-[40px] px-3 rounded-lg border text-sm font-medium transition ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-8">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3 font-sans font-medium">
                  Cor
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-10 px-4 rounded-lg border text-sm font-medium transition ${
                        selectedColor === color
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                className="flex-1 rounded-xl h-12 text-sm font-semibold tracking-wide"
                disabled={!product.stock_status}
              >
                {product.stock_status ? "Adicionar ao Carrinho" : "Esgotado"}
              </Button>
              <FavoriteButton productId={product.id} className="border border-border h-12 w-12" />
              <ShareButton name={product.name} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
