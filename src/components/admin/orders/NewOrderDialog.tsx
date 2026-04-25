import { useState, useRef, useEffect } from "react";
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
import { toast } from "sonner";
import {
  Search, Plus, Minus, Trash2, ShoppingBag, Store, Globe,
  ChevronRight, ChevronLeft, User, CreditCard, CheckCircle2,
  Package, Sparkles,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import PixCheckoutDialog from "@/components/checkout/PixCheckoutDialog";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

type SaleChannel = "presencial" | "online" | null;
type Step = "channel" | "products" | "customer" | "confirm";

const PAYMENT_METHODS = {
  presencial: [
    { value: "pix", label: "PIX", icon: "📱" },
    { value: "dinheiro", label: "Dinheiro", icon: "💵" },
    { value: "credito", label: "Crédito", icon: "💳" },
    { value: "debito", label: "Débito", icon: "💳" },
    { value: "crediario", label: "Crediário", icon: "📋" },
  ],
  online: [
    { value: "pix", label: "PIX", icon: "📱" },
    { value: "credito", label: "Crédito", icon: "💳" },
    { value: "crediario", label: "Crediário", icon: "📋" },
  ],
};

const STEP_ORDER: Step[] = ["channel", "products", "customer", "confirm"];
const STEP_META: Record<Step, { label: string; icon: typeof Store }> = {
  channel: { label: "Canal", icon: Store },
  products: { label: "Produtos", icon: Package },
  customer: { label: "Cliente", icon: User },
  confirm: { label: "Confirmar", icon: CheckCircle2 },
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
    name: "", phone: "", email: "", notes: "", payment_method: "pix", installments: 1,
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

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
        .select("id, name, price, images, stock_status, stock_quantity, sku, category_id, categories(name)")
        .eq("stock_status", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Auto-focus on step change
  useEffect(() => {
    if (step === "products") setTimeout(() => searchRef.current?.focus(), 200);
    if (step === "customer") setTimeout(() => nameRef.current?.focus(), 200);
  }, [step]);

  const filteredProducts = products?.filter(
    (p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Group by category
  const grouped = filteredProducts?.reduce((acc, p) => {
    const cat = (p as any).categories?.name || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, typeof filteredProducts>) || {};

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        image: product.images?.[0],
        sku: product.sku,
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)).filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const sellerName = userProfile?.full_name || user?.email?.split("@")[0] || "—";

  const paymentMethods = channel ? PAYMENT_METHODS[channel] : PAYMENT_METHODS.online;
  const currentIdx = STEP_ORDER.indexOf(step);

  const canProceed = () => {
    if (step === "channel") return !!channel;
    if (step === "products") return cart.length > 0;
    if (step === "customer") return customer.name.trim().length > 0 && customer.phone.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (currentIdx < STEP_ORDER.length - 1 && canProceed()) {
      setStep(STEP_ORDER[currentIdx + 1]);
    }
  };

  const goBack = () => {
    if (currentIdx > 0) setStep(STEP_ORDER[currentIdx - 1]);
  };

  const selectChannel = (ch: SaleChannel) => {
    setChannel(ch);
    // Auto-advance after selecting channel
    setTimeout(() => setStep("products"), 250);
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      const items = cart.map((i) => ({
        product_id: i.id, name: i.name, price: i.price, quantity: i.quantity,
      }));
      const isCredit = customer.payment_method === "crediario";
      const { error } = await supabase.from("orders").insert({
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        notes: customer.notes || null,
        payment_method: customer.payment_method,
        installments: isCredit ? Math.max(1, customer.installments) : 1,
        items, total,
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
      toast.success(channel === "presencial" ? "✅ Venda presencial registrada!" : "✅ Venda online criada!");
      resetAndClose();
    },
    onError: (e: any) => toast.error("Erro ao registrar venda: " + (e?.message || "")),
  });

  const resetAndClose = () => {
    setStep("channel"); setChannel(null); setCart([]); setProductSearch("");
    setCustomer({ name: "", phone: "", email: "", notes: "", payment_method: "pix", installments: 1 });
    onOpenChange(false);
  };

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 gap-0 bg-card border-border overflow-hidden">
        {/* ── Header with progress ── */}
        <div className="px-4 pt-4 pb-3 border-b border-border/60">
          <DialogHeader className="mb-3">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Nova Venda
              {channel && (
                <span className="text-[10px] font-normal text-muted-foreground ml-1">
                  · {channel === "presencial" ? "🏪 Presencial" : "🌐 Online"}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Progress bar */}
          <div className="flex items-center gap-1">
            {STEP_ORDER.map((s, i) => {
              const active = step === s;
              const completed = currentIdx > i;
              const Icon = STEP_META[s].icon;
              return (
                <button
                  key={s}
                  onClick={() => { if (completed) setStep(s); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : completed
                      ? "text-accent cursor-pointer hover:bg-accent/5"
                      : "text-muted-foreground/40 cursor-default"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-colors",
                    active ? "bg-primary text-primary-foreground" : completed ? "bg-accent/20 text-accent" : "bg-muted/50"
                  )}>
                    {completed ? "✓" : i + 1}
                  </div>
                  <span className="hidden sm:inline">{STEP_META[s].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Channel */}
            {step === "channel" && (
              <motion.div key="channel" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.15 }} className="p-5">
                <p className="text-xs text-muted-foreground mb-4">Como essa venda será realizada?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { ch: "presencial" as const, icon: Store, title: "Presencial", desc: "Cliente na loja", badge: "💰 Pagamento imediato" },
                    { ch: "online" as const, icon: Globe, title: "Online", desc: "WhatsApp · Instagram", badge: "📦 Envio / Retirada" },
                  ].map(({ ch, icon: Icon, title, desc, badge }) => (
                    <button
                      key={ch}
                      onClick={() => selectChannel(ch)}
                      className={cn(
                        "relative flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all duration-200",
                        channel === ch
                          ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary-rgb,200,170,100),0.15)]"
                          : "border-border hover:border-primary/40 hover:bg-secondary/30"
                      )}
                    >
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
                        channel === ch ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-semibold">{title}</p>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground/70 bg-secondary/50 px-2 py-0.5 rounded-full">{badge}</span>
                    </button>
                  ))}
                </div>

                {channel === "presencial" && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-lg bg-secondary/40 border border-border flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[11px] text-muted-foreground">Vendedor(a):</span>
                    <span className="text-[12px] font-semibold">{sellerName}</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Products */}
            {step === "products" && (
              <motion.div key="products" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.15 }} className="flex flex-col h-full">
                {/* Search */}
                <div className="px-4 py-2.5 border-b border-border/60">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      ref={searchRef}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar por nome ou SKU..."
                      className="pl-9 h-9 text-[13px] rounded-lg bg-secondary/30 border-border/60"
                    />
                    {productSearch && (
                      <button onClick={() => setProductSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Product list grouped by category */}
                <ScrollArea className="flex-1" style={{ maxHeight: cart.length > 0 ? "220px" : "320px" }}>
                  <div className="p-2">
                    {Object.entries(grouped).map(([cat, prods]) => (
                      <div key={cat}>
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-2 py-1.5 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                          {cat}
                        </p>
                        {prods?.map((product) => {
                          const inCart = cart.find((i) => i.id === product.id);
                          return (
                            <button
                              key={product.id}
                              onClick={() => addToCart(product)}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left group",
                                inCart ? "bg-primary/5 border border-primary/20" : "hover:bg-secondary/50"
                              )}
                            >
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-secondary flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                  <Package className="h-4 w-4 text-muted-foreground/30" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium truncate">{product.name}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-primary">{fmt(Number(product.price))}</span>
                                  {product.sku && (
                                    <span className="text-[9px] font-mono text-muted-foreground/50 bg-secondary/60 px-1 py-px rounded">{product.sku}</span>
                                  )}
                                </div>
                              </div>
                              {inCart ? (
                                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full min-w-[24px] text-center">
                                  {inCart.quantity}×
                                </span>
                              ) : (
                                <Plus className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    {filteredProducts?.length === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center py-8">Nenhum produto encontrado.</p>
                    )}
                  </div>
                </ScrollArea>

                {/* Cart summary (sticky bottom) */}
                {cart.length > 0 && (
                  <div className="border-t border-border bg-card px-4 py-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Carrinho ({itemCount} {itemCount === 1 ? "item" : "itens"})
                      </p>
                      <button onClick={() => setCart([])} className="text-[9px] text-destructive/70 hover:text-destructive">Limpar</button>
                    </div>
                    <div className="space-y-1 max-h-[80px] overflow-y-auto scrollbar-hide">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                          <span className="flex-1 truncate font-medium">{item.name}</span>
                          <div className="flex items-center gap-px bg-secondary/60 rounded-md">
                            <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-secondary rounded-l-md"><Minus className="h-2.5 w-2.5" /></button>
                            <span className="text-[10px] w-5 text-center tabular-nums font-bold">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-secondary rounded-r-md"><Plus className="h-2.5 w-2.5" /></button>
                          </div>
                          <span className="text-[10px] tabular-nums w-14 text-right font-semibold">{fmt(item.price * item.quantity)}</span>
                          <button onClick={() => removeItem(item.id)} className="p-0.5 text-muted-foreground/40 hover:text-destructive"><Trash2 className="h-2.5 w-2.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/60">
                      <span className="text-[12px] font-bold">Total</span>
                      <span className="text-[14px] font-bold text-primary tabular-nums">{fmt(total)}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Customer + Payment */}
            {step === "customer" && (
              <motion.div key="customer" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.15 }} className="px-4 py-4 space-y-3">
                {/* Quick summary */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/50 text-[11px]">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
                  <span className="ml-auto font-bold text-primary">{fmt(total)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome *</label>
                    <Input
                      ref={nameRef}
                      value={customer.name}
                      onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                      placeholder="Nome completo"
                      className="h-9 text-[13px] rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone *</label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      className="h-9 text-[13px] rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Email (opcional)</label>
                  <Input
                    value={customer.email}
                    onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="h-9 text-[13px] rounded-lg"
                  />
                </div>

                {/* Payment methods */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Forma de Pagamento
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.value}
                        onClick={() => setCustomer((c) => ({ ...c, payment_method: pm.value }))}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all",
                          customer.payment_method === pm.value
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/60 hover:border-primary/30 text-muted-foreground"
                        )}
                      >
                        <span>{pm.icon}</span>
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Installments selector — only for crediário */}
                {customer.payment_method === "crediario" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <label className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                      📋 Número de Parcelas
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                        <button
                          key={n}
                          onClick={() => setCustomer((c) => ({ ...c, installments: n }))}
                          className={cn(
                            "h-8 min-w-[36px] px-2.5 rounded-md text-[12px] font-semibold border transition-all tabular-nums",
                            customer.installments === n
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 hover:border-primary/40 text-muted-foreground"
                          )}
                        >
                          {n}×
                        </button>
                      ))}
                    </div>
                    {customer.installments > 1 && total > 0 && (
                      <p className="text-[10px] text-muted-foreground pt-1">
                        {customer.installments}× de{" "}
                        <span className="font-semibold text-foreground">
                          {fmt(total / customer.installments)}
                        </span>{" "}
                        · 1ª vence em 30 dias
                      </p>
                    )}
                  </motion.div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Observações</label>
                  <Textarea
                    value={customer.notes}
                    onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
                    placeholder="Ex: presente, embalagem especial..."
                    className="min-h-[50px] resize-none text-[12px] rounded-lg"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {step === "confirm" && (
              <motion.div key="confirm" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.15 }} className="px-4 py-4 space-y-3">
                {/* Sale details */}
                <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/0 border border-primary/15 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-[12px] font-bold">Resumo da Venda</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-muted-foreground">Canal:</span> <span className="font-medium">{channel === "presencial" ? "🏪 Presencial" : "🌐 Online"}</span></div>
                    <div><span className="text-muted-foreground">Vendedor:</span> <span className="font-medium">{sellerName}</span></div>
                    <div><span className="text-muted-foreground">Pagamento:</span> <span className="font-medium">{paymentMethods.find((pm) => pm.value === customer.payment_method)?.icon} {paymentMethods.find((pm) => pm.value === customer.payment_method)?.label}{customer.payment_method === "crediario" ? ` ${customer.installments}×` : ""}</span></div>
                    <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{new Date().toLocaleDateString("pt-BR")}</span></div>
                  </div>
                </div>

                {/* Customer */}
                <div className="rounded-lg bg-secondary/30 border border-border/60 p-3">
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Cliente</p>
                  <p className="text-[13px] font-semibold">{customer.name}</p>
                  <p className="text-[11px] text-muted-foreground">{customer.phone}</p>
                  {customer.email && <p className="text-[10px] text-muted-foreground">{customer.email}</p>}
                  {customer.notes && <p className="text-[10px] text-muted-foreground/70 italic mt-1">"{customer.notes}"</p>}
                </div>

                {/* Items */}
                <div className="rounded-lg bg-secondary/30 border border-border/60 p-3">
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">
                    Itens ({itemCount})
                  </p>
                  <div className="space-y-1.5">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-[11px]">
                        {item.image && <img src={item.image} alt="" className="w-7 h-7 rounded-md object-cover" />}
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                        <span className="font-semibold tabular-nums">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2.5 mt-2.5 border-t border-border/60">
                    <span className="text-[13px] font-bold">Total</span>
                    <span className="text-[15px] font-bold text-primary tabular-nums">{fmt(total)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-border/60 flex items-center gap-2">
          {step === "channel" ? (
            <>
              <Button variant="ghost" size="sm" onClick={resetAndClose} className="text-[12px] text-muted-foreground">
                Cancelar
              </Button>
              <div className="flex-1" />
              <Button size="sm" disabled={!channel} onClick={goNext} className="text-[12px] gap-1 px-4">
                Continuar <ChevronRight className="h-3 w-3" />
              </Button>
            </>
          ) : step === "confirm" ? (
            <>
              <Button variant="ghost" size="sm" onClick={goBack} className="text-[12px] gap-1">
                <ChevronLeft className="h-3 w-3" /> Voltar
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                disabled={createOrder.isPending}
                onClick={() => createOrder.mutate()}
                className="text-[12px] gap-1.5 px-5 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {createOrder.isPending ? "Registrando..." : "Confirmar Venda"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={goBack} className="text-[12px] gap-1">
                <ChevronLeft className="h-3 w-3" /> Voltar
              </Button>
              <div className="flex-1" />
              {step === "products" && cart.length > 0 && (
                <span className="text-[10px] text-muted-foreground mr-2">{fmt(total)}</span>
              )}
              <Button
                size="sm"
                disabled={!canProceed()}
                onClick={goNext}
                className="text-[12px] gap-1 px-4"
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
