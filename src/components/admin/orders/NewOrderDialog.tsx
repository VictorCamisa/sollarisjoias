import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Search, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export const NewOrderDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"products" | "customer">("products");
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    payment_method: "pix",
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, images, stock_status")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = products?.filter(
    (p) =>
      p.stock_status &&
      (!productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()))
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
        items,
        total,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Pedido criado com sucesso!");
      resetAndClose();
    },
    onError: () => toast.error("Erro ao criar pedido"),
  });

  const resetAndClose = () => {
    setStep("products");
    setCart([]);
    setCustomer({ name: "", phone: "", email: "", notes: "" });
    setProductSearch("");
    onOpenChange(false);
  };

  const canProceed = cart.length > 0;
  const canSubmit =
    customer.name.trim().length > 0 && customer.phone.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 bg-card border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Novo Pedido
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex gap-2 mt-3">
            {["Produtos", "Cliente"].map((label, i) => {
              const active =
                (i === 0 && step === "products") ||
                (i === 1 && step === "customer");
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {step === "products" ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Product search */}
            <div className="px-6 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar produto..."
                  className="admin-input pl-9"
                />
              </div>
            </div>

            {/* Product list */}
            <ScrollArea className="flex-1 max-h-[280px]">
              <div className="p-3 grid grid-cols-1 gap-1.5">
                {filteredProducts?.map((product) => {
                  const inCart = cart.find((i) => i.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-left group"
                    >
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-secondary"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(Number(product.price))}
                        </p>
                      </div>
                      {inCart && (
                        <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                          {inCart.quantity}x
                        </span>
                      )}
                      <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Cart summary */}
            {cart.length > 0 && (
              <div className="border-t border-border px-6 py-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Carrinho ({cart.length} {cart.length === 1 ? "item" : "itens"})
                </p>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="flex-1 truncate">{item.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="p-0.5 rounded hover:bg-secondary"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs w-5 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="p-0.5 rounded hover:bg-secondary"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs tabular-nums w-20 text-right font-medium">
                        {fmt(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {fmt(total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Nome do cliente *
                </label>
                <Input
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer((c) => ({ ...c, name: e.target.value }))
                  }
                  placeholder="Nome completo"
                  className="admin-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Telefone *
                </label>
                <Input
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer((c) => ({ ...c, phone: e.target.value }))
                  }
                  placeholder="(00) 00000-0000"
                  className="admin-input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email (opcional)
              </label>
              <Input
                value={customer.email}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, email: e.target.value }))
                }
                placeholder="email@exemplo.com"
                className="admin-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Observações
              </label>
              <Textarea
                value={customer.notes}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, notes: e.target.value }))
                }
                placeholder="Ex: presente, embalagem especial..."
                className="admin-input min-h-[80px] resize-none"
              />
            </div>

            {/* Order summary */}
            <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Resumo do Pedido
              </p>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span className="tabular-nums font-medium">
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span>Total</span>
                <span className="text-primary">{fmt(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border flex justify-between">
          {step === "products" ? (
            <>
              <Button variant="ghost" size="sm" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={!canProceed}
                onClick={() => setStep("customer")}
              >
                Próximo: Cliente →
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("products")}
              >
                ← Voltar
              </Button>
              <Button
                size="sm"
                disabled={!canSubmit || createOrder.isPending}
                onClick={() => createOrder.mutate()}
              >
                {createOrder.isPending ? "Criando..." : "Criar Pedido"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
