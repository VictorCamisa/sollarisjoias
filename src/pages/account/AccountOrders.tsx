import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";

const statusLabel: Record<string, { label: string; className: string }> = {
  pending: { label: "Aguardando pagamento", className: "text-warning" },
  paid: { label: "Pago", className: "text-success" },
  shipped: { label: "Enviado", className: "text-info" },
  delivered: { label: "Entregue", className: "text-success" },
  cancelled: { label: "Cancelado", className: "text-destructive" },
};

const AccountOrders = () => {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["account-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-card border border-border" />;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-card border border-border p-10 sm:p-14 text-center">
        <Package className="h-10 w-10 mx-auto text-foreground/25 mb-4" strokeWidth={1.3} />
        <h3 className="font-display text-xl text-foreground mb-2">Nenhum pedido por aqui</h3>
        <p className="font-sans text-sm text-foreground/60 mb-6">
          Quando você fizer seu primeiro pedido, ele aparece nesta lista.
        </p>
        <Link
          to="/colecao"
          className="inline-flex items-center gap-2 bg-bordeaux text-maison-creme font-mono text-[11px] uppercase tracking-[0.22em] px-6 py-3 hover:bg-maison-bordeaux-deep transition-colors"
        >
          Explorar coleção
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order: any) => {
        const status = statusLabel[order.status] ?? { label: order.status, className: "text-foreground" };
        const itemCount = Array.isArray(order.items) ? order.items.length : 0;
        return (
          <div key={order.id} className="bg-card border border-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-1">
                Pedido #{order.id.slice(0, 8)}
              </p>
              <p className="font-display text-base text-foreground">
                {itemCount} {itemCount === 1 ? "peça" : "peças"} · {new Date(order.created_at).toLocaleDateString("pt-BR")}
              </p>
              <p className={`font-mono text-[10.5px] uppercase tracking-[0.22em] mt-1.5 ${status.className}`}>
                {status.label}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-display text-xl text-foreground tabular-nums">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(order.total))}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55 mt-0.5">
                {order.payment_method}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AccountOrders;
