import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, ShoppingBag, Store, Globe, ChevronRight, User, CreditCard, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

type SaleChannel = "presencial" | "online" | null;
type Step = "channel" | "products" | "customer" | "confirm";

const PAYMENT_METHODS_PRESENCIAL = [
  { value: "pix", label: "PIX", icon: "📱" },
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "credito", label: "Cartão Crédito", icon: "💳" },
  { value: "debito", label: "Cartão Débito", icon: "💳" },
  { value: "crediario", label: "Crediário", icon: "📋" },
];

const PAYMENT_METHODS_ONLINE = [
  { value: "pix", label: "PIX", icon: "📱" },
  { value: "credito", label: "Cartão Crédito", icon: "💳" },
  { value: "crediario", label: "Crediário", icon: "📋" },
];

const STEPS: Record<Step, { label: string; num: number }> = {
  channel: { label: "Canal", num: 1 },
  products: { label: "Produtos", num: 2 },
  customer: { label: "Cliente", num: 3 },
  confirm: { label: "Confirmar", num: 4 },
};

export const NewOrderDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("channel");
  const [channel, setChannel] = useState<SaleChannel>(null);
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    payment_method: "pix",
  });

  // Get current user profile for sold_by_name
  const { data: userProfile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, images, stock_status, stock_quantity, sku")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = products?.filter(
    (p) =>
      p.stock_status &&
      (!productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())))
  );

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          image: product.images?.[0],
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const sellerName = userProfile?.full_name || user?.email?.split("@")[0] || "—";

  const createOrder = useMutation({
    mutationFn: async () => {
      const items = cart.map((i) => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));
      const { error } = await supabase.from("orders").insert({
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        notes: customer.notes || null,
        payment_method: customer.payment_method,
        items,
        total,
        status: channel === "presencial" ? "confirmed" : "pending",
        sale_channel: channel,
        sold_by: user?.id || null,
        sold_by_name: sellerName,
        sold_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-orders"] });
      toast.success(
        channel === "presencial"
          ? "Venda presencial registrada!"
          : "Venda online criada!"
      );
      resetAndClose();
    },
    onError: () => toast.error("Erro ao registrar venda"),
  });

  const resetAndClose = () => {
    setStep("channel");
    setChannel(null);
    setCart([]);
    setCustomer({ name: "", phone: "", email: "", notes: "", payment_method: "pix" });
    setProductSearch("");
    onOpenChange(false);
  };

  const canProceedFromProducts = cart.length > 0;
  const canProceedFromCustomer =
    customer.name.trim().length > 0 && customer.phone.trim().length > 0;

  const paymentMethods = channel === "presencial" ? PAYMENT_METHODS_PRESENCIAL : PAYMENT_METHODS_ONLINE;

  const stepOrder: Step[] = ["channel", "products", "customer", "confirm"];
  const currentStepIndex = stepOrder.indexOf(step);

  const goNext = () => {
    if (step === "channel" && channel) setStep("products");
    else if (step === "products" && canProceedFromProducts) setStep("customer");
    else if (step === "customer" && canProceedFromCustomer) setStep("confirm");
  };

  const goBack = () => {
    if (currentStepIndex > 0) setStep(stepOrder[currentStepIndex - 1]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 bg-card border-border">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Nova Venda
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex gap-1 mt-2">
            {stepOrder.map((s, i) => {
              const active = step === s;
              const completed = currentStepIndex > i;
              return (
                <div
                  key={s}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                    active ? "bg-primary/15 text-primary" : completed ? "text-accent" : "text-muted-foreground/50"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                      active ? "bg-primary text-primary-foreground" : completed ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground/50"
                    )}
                  >
                    {completed ? "✓" : STEPS[s].num}
                  </span>
                  {STEPS[s].label}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ─── Step 1: Channel Selection ─── */}
          {step === "channel" && (
            <motion.div
              key="channel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="flex-1 px-5 py-6"
            >
              <p className="text-[13px] text-muted-foreground mb-4">Como essa venda será realizada?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setChannel("presencial")}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-lg border-2 transition-all",
                    channel === "presencial"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-secondary/30"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center",
                    channel === "presencial" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    <Store className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold">Venda Presencial</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Cliente na loja · Pagamento imediato
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setChannel("online")}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-lg border-2 transition-all",
                    channel === "online"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-secondary/30"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center",
                    channel === "online" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    <Globe className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold">Venda Online</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      WhatsApp, Instagram · Envio
                    </p>
                  </div>
                </button>
              </div>

              {channel === "presencial" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-secondary/40 border border-border"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[11px] text-muted-foreground">Vendedor(a):</span>
                    <span className="text-[12px] font-semibold">{sellerName}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── Step 2: Products ─── */}
          {step === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-5 py-2.5 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar produto ou SKU..."
                    className="admin-input pl-9"
                    autoFocus
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[240px]">
                <div className="p-2 grid grid-cols-1 gap-px">
                  {filteredProducts?.map((product) => {
                    const inCart = cart.find((i) => i.id === product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors text-left group"
                      >
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-9 h-9 rounded-md object-cover bg-secondary" />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium truncate">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {fmt(Number(product.price))}
                            {product.sku && <span className="ml-1.5 font-mono text-muted-foreground/50">{product.sku}</span>}
                          </p>
                        </div>
                        {inCart && (
                          <span className="text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                            {inCart.quantity}×
                          </span>
                        )}
                        <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                  {filteredProducts?.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center py-8">Nenhum produto encontrado.</p>
                  )}
                </div>
              </ScrollArea>

              {cart.length > 0 && (
                <div className="border-t border-border px-5 py-2.5 space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Itens ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </p>
                  <div className="space-y-1 max-h-[100px] overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-[12px]">
                        <span className="flex-1 truncate">{item.name}</span>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => updateQty(item.id, -1)} className="p-0.5 rounded hover:bg-secondary"><Minus className="h-2.5 w-2.5" /></button>
                          <span className="text-[11px] w-4 text-center tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-0.5 rounded hover:bg-secondary"><Plus className="h-2.5 w-2.5" /></button>
                        </div>
                        <span className="text-[11px] tabular-nums w-16 text-right font-medium">{fmt(item.price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.id)} className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-border">
                    <span className="text-[12px] font-semibold">Total</span>
                    <span className="text-[13px] font-bold text-primary tabular-nums">{fmt(total)}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Step 3: Customer + Payment ─── */}
          {step === "customer" && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="flex-1 px-5 py-4 space-y-3 overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome *</label>
                  <Input
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Nome completo"
                    className="admin-input"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone *</label>
                  <Input
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="admin-input"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Email (opcional)</label>
                <Input
                  value={customer.email}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="admin-input"
                />
              </div>

              {/* Payment */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Pagamento
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.value}
                      onClick={() => setCustomer((c) => ({ ...c, payment_method: pm.value }))}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-[11px] font-medium transition-all",
                        customer.payment_method === pm.value
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      )}
                    >
                      <span className="text-sm">{pm.icon}</span>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Observações</label>
                <Textarea
                  value={customer.notes}
                  onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
                  placeholder="Ex: presente, embalagem especial..."
                  className="admin-input min-h-[60px] resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* ─── Step 4: Confirmation ─── */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="flex-1 px-5 py-4 space-y-3 overflow-y-auto"
            >
              {/* Sale info */}
              <div className="rounded-lg bg-secondary/30 border border-border p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Informações da Venda</p>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-muted-foreground">Canal:</span>{" "}
                    <span className="font-medium">{channel === "presencial" ? "🏪 Presencial" : "🌐 Online"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendedor:</span>{" "}
                    <span className="font-medium">{sellerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pagamento:</span>{" "}
                    <span className="font-medium">
                      {paymentMethods.find((pm) => pm.value === customer.payment_method)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data:</span>{" "}
                    <span className="font-medium">{new Date().toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-lg bg-secondary/30 border border-border p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</p>
                <p className="text-[13px] font-medium">{customer.name}</p>
                <p className="text-[11px] text-muted-foreground">{customer.phone}</p>
                {customer.email && <p className="text-[11px] text-muted-foreground">{customer.email}</p>}
                {customer.notes && <p className="text-[10px] text-muted-foreground italic mt-1">"{customer.notes}"</p>}
              </div>

              {/* Items */}
              <div className="rounded-lg bg-secondary/30 border border-border p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Itens ({cart.reduce((s, i) => s + i.quantity, 0)})
                </p>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-[12px]">
                    <span>{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                    <span className="tabular-nums font-medium">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border text-[14px] font-bold">
                  <span>Total</span>
                  <span className="text-primary">{fmt(total)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-between items-center">
          {step === "channel" ? (
            <>
              <Button variant="ghost" size="sm" onClick={resetAndClose} className="text-[12px]">Cancelar</Button>
              <Button size="sm" disabled={!channel} onClick={goNext} className="text-[12px] gap-1">
                Continuar <ChevronRight className="h-3 w-3" />
              </Button>
            </>
          ) : step === "confirm" ? (
            <>
              <Button variant="ghost" size="sm" onClick={goBack} className="text-[12px]">← Voltar</Button>
              <Button
                size="sm"
                disabled={createOrder.isPending}
                onClick={() => createOrder.mutate()}
                className="text-[12px] gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {createOrder.isPending ? "Registrando..." : "Confirmar Venda"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={goBack} className="text-[12px]">← Voltar</Button>
              <Button
                size="sm"
                disabled={step === "products" ? !canProceedFromProducts : !canProceedFromCustomer}
                onClick={goNext}
                className="text-[12px] gap-1"
              >
                Continuar <ChevronRight className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
