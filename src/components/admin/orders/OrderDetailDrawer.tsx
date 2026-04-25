import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Mail, Calendar, Package, StickyNote, Copy, MapPin, CreditCard, Truck, IdCard } from "lucide-react";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  confirmed: { label: "Confirmado", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  shipped: { label: "Enviado", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  delivered: { label: "Entregue", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Cancelado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface OrderDetailDrawerProps {
  order: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const OrderDetailDrawer = ({ order, open, onOpenChange }: OrderDetailDrawerProps) => {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Status atualizado!");
    },
  });

  if (!order) return null;

  const items = (order.items as any[]) || [];
  const st = statusMap[order.status] || statusMap.pending;
  const date = new Date(order.created_at);

  const copyId = () => {
    navigator.clipboard.writeText(order.id.slice(0, 8).toUpperCase());
    toast.success("ID copiado!");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </SheetTitle>
            <button onClick={copyId} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <Badge className={`w-fit text-[10px] border ${st.color}`}>{st.label}</Badge>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Customer info */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</h3>
            <div className="space-y-2">
              <p className="text-sm font-semibold">{order.customer_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{order.customer_email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  {" às "}
                  {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-3 w-3" />
              Itens ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">Qtd: {item.quantity} × {fmt(item.price)}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-sm font-bold">Total</span>
              <span className="text-lg font-bold text-primary tabular-nums">{fmt(Number(order.total))}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <StickyNote className="h-3 w-3" />
                Observações
              </h3>
              <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">{order.notes}</p>
            </div>
          )}

          {/* Status change */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alterar Status</h3>
            <Select
              value={order.status}
              onValueChange={(v) => updateStatus.mutate(v)}
            >
              <SelectTrigger className="admin-input h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusMap).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              const msg = `Olá ${order.customer_name}! Seu pedido #${order.id.slice(0, 8).toUpperCase()} está sendo processado. Total: ${fmt(Number(order.total))}`;
              window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
            }}
          >
            <Phone className="h-3.5 w-3.5 mr-1.5" />
            WhatsApp
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
