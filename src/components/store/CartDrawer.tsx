import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/hooks/useStore";
import { motion, AnimatePresence } from "framer-motion";

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { data: settings } = useSettings();

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleCheckout = () => {
    if (!settings?.whatsapp_number || items.length === 0) return;

    const lines = items.map(
      (item) => `• ${item.name} (x${item.quantity}) — ${formatPrice(item.price * item.quantity)}`
    );
    const message = `Olá! Gostaria de finalizar meu pedido:\n\n${lines.join("\n")}\n\nTotal: ${formatPrice(totalPrice)}`;
    const url = `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-sans text-[11px] tracking-[0.2em] uppercase text-foreground">
                Sacola ({items.length})
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center mt-12 font-sans">
                  Sua sacola está vazia.
                </p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover bg-secondary"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-secondary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-foreground truncate">{item.name}</p>
                      <p className="font-sans text-sm text-accent mt-1">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-muted-foreground hover:text-foreground">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-sans text-xs w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-muted-foreground hover:text-foreground">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-6 py-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
                    Total
                  </span>
                  <span className="font-sans text-lg text-foreground">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
                >
                  Finalizar pelo WhatsApp
                </button>
                <button
                  onClick={clearCart}
                  className="w-full text-center font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar sacola
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
