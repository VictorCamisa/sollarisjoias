import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ShoppingCart, Eye } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { OrderStatsCards } from "@/components/admin/orders/OrderStatsCards";
import { NewOrderDialog } from "@/components/admin/orders/NewOrderDialog";
import { OrderDetailDrawer } from "@/components/admin/orders/OrderDetailDrawer";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  confirmed: { label: "Confirmado", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  shipped: { label: "Enviado", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  delivered: { label: "Entregue", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Cancelado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = orders?.filter((o) => {
    const s = search.toLowerCase();
    const matchSearch = !search || o.customer_name.toLowerCase().includes(s) || o.customer_phone.includes(search) || o.id.toLowerCase().includes(s);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Status atualizado!");
    },
  });

  const stats = {
    total: orders?.length ?? 0,
    pending: orders?.filter((o) => o.status === "pending").length ?? 0,
    confirmed: orders?.filter((o) => o.status === "confirmed").length ?? 0,
    delivered: orders?.filter((o) => o.status === "delivered").length ?? 0,
    cancelled: orders?.filter((o) => o.status === "cancelled").length ?? 0,
    revenue: orders?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Vendas</h1>
          <p className="admin-page-subtitle">{filtered?.length ?? 0} vendas encontradas</p>
        </div>
        <Button size="sm" onClick={() => setNewOrderOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nova Venda
        </Button>
      </div>

      {/* Stats */}
      <OrderStatsCards stats={stats} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente, telefone ou ID..." className="admin-input pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusMap).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-card/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-20">
          <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setNewOrderOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Criar primeiro pedido
          </Button>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.5fr)_100px_130px_40px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cliente</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Data</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Itens</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Total</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Status</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {filtered.map((order, i) => {
              const items = (order.items as any[]) || [];
              const st = statusMap[order.status] || statusMap.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.5fr)_100px_130px_40px] gap-2 md:gap-3 items-center px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer group"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{order.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{order.customer_phone}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {items.map((item: any) => `${item.name} ×${item.quantity}`).join(", ")}
                  </div>
                  <span className="text-[13px] font-semibold text-right tabular-nums">{fmt(Number(order.total))}</span>
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                      <SelectTrigger className={`w-full h-7 text-[10px] rounded-md border ${st.color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusMap).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="hidden md:flex justify-center">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />
      <OrderDetailDrawer order={selectedOrder} open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)} />
    </div>
  );
};

export default AdminOrders;
