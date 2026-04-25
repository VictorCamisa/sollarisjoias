import { X, Minus, Plus, Trash2, MessageCircle, CreditCard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/hooks/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NativeCheckoutDialog from "@/components/checkout/NativeCheckoutDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { data: settings } = useSettings();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const navigate = useNavigate();

  const handleMpCheckout = () => {
    if (items.length === 0) return;
    setCheckoutOpen(true);
  };

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleCheckout = () => {
    if (items.length === 0) return;

    const whatsappNumber = "5512991895250";

    const lines = items.map(
      (item, i) => `${i + 1}. ${item.name}\n   Qtd: ${item.quantity} | Unit: ${formatPrice(item.price)} | Subtotal: ${formatPrice(item.price * item.quantity)}`
    );

    const message = [
      `🛍 *PEDIDO SOLLARIS*`,
      `━━━━━━━━━━━━━━━━━━━`,
      ``,
      ...lines,
      ``,
      `━━━━━━━━━━━━━━━━━━━`,
      `*Total: ${formatPrice(totalPrice)}*`,
      `Itens: ${items.reduce((sum, item) => sum + item.quantity, 0)}`,
      ``,
      `📅 ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    ].join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
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

          {/* Drawer — full width on mobile */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md bg-card border-l border-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border flex-shrink-0">
              <h2 className="font-sans text-[11px] tracking-[0.2em] uppercase text-foreground">
                Sacola ({items.length})
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="font-serif text-4xl text-muted-foreground/10 mb-4">✦</div>
                  <p className="text-muted-foreground text-sm font-sans">
                    Sua sacola está vazia.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-3 sm:gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-24 sm:w-20 sm:h-20 object-cover bg-secondary rounded-xl flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-24 sm:w-20 sm:h-20 bg-secondary rounded-xl flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="font-sans text-sm text-foreground truncate">{item.name}</p>
                      <p className="font-sans text-sm text-accent mt-1">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-0 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-sans text-xs w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-auto p-2 text-muted-foreground hover:text-destructive active:scale-90 transition-all"
                        >
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
              <div className="border-t border-border px-4 sm:px-6 py-4 sm:py-5 space-y-3 flex-shrink-0 pb-[env(safe-area-inset-bottom,16px)]">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
                    Total
                  </span>
                  <span className="font-sans text-lg text-foreground">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <button
                  onClick={handleMpCheckout}
                  className="w-full h-12 sm:h-13 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
                >
                  <CreditCard className="h-4 w-4" />
                  Pagar com Pix ou Cartão
                </button>
                <button
                  onClick={handleCheckout}
                  className="w-full h-12 sm:h-13 border border-border text-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
                >
                  <MessageCircle className="h-4 w-4" />
                  Finalizar pelo WhatsApp
                </button>
                <button
                  onClick={clearCart}
                  className="w-full text-center font-sans text-xs text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1"
                >
                  Limpar sacola
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
      <NativeCheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items.map((i) => ({
          id: i.id,
          title: i.name,
          quantity: i.quantity,
          unit_price: i.price,
          picture_url: i.image,
        }))}
        amount={totalPrice}
        onSuccess={async (paymentId, customer) => {
          let createdOrderId: string | undefined;
          const orderTotal = totalPrice;
          const itemsSnapshot = [...items];
          try {
            const { data: order, error } = await supabase
              .from("orders")
              .insert({
                customer_name: customer?.name || "Cliente Loja",
                customer_phone: customer?.phone || "",
                customer_email: customer?.email || null,
                items: itemsSnapshot.map((i) => ({
                  product_id: i.id,
                  name: i.name,
                  quantity: i.quantity,
                  price: i.price,
                  image: i.image,
                })),
                total: orderTotal,
                payment_method: customer?.paymentMethod || "pix",
                sale_channel: "online",
                status: customer?.paymentStatus === "paid" ? "paid" : "pending",
                installments: customer?.installments || 1,
                notes: `Mercado Pago • Payment ID: ${paymentId}`,
              })
              .select()
              .single();

            if (error) throw error;
            createdOrderId = order?.id;

            if (createdOrderId && paymentId) {
              await supabase
                .from("pix_transactions")
                .update({ order_id: createdOrderId })
                .eq("mp_payment_id", paymentId);
            }
          } catch (err) {
            console.error("Erro ao criar pedido:", err);
            toast.error("Pagamento ok, mas houve erro ao registrar o pedido. Entre em contato.");
          }

          // Fecha modal e drawer; navega pra tela de sucesso editorial
          setCheckoutOpen(false);
          setIsOpen(false);

          // Pequeno delay pra animação do modal sair antes de navegar
          setTimeout(() => {
            navigate("/checkout/sucesso", {
              state: {
                orderId: createdOrderId,
                paymentId,
                customerName: customer?.name,
                customerPhone: customer?.phone,
                customerEmail: customer?.email,
                total: orderTotal,
                paymentMethod: customer?.paymentMethod,
              },
            });
          }, 300);
        }}
      />
    </AnimatePresence>
  );
};

export default CartDrawer;
