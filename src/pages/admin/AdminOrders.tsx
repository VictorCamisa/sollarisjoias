import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "Pendente", variant: "outline", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  confirmed: { label: "Confirmado", variant: "default", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  shipped: { label: "Enviado", variant: "secondary", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  delivered: { label: "Entregue", variant: "default", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  cancelled: { label: "Cancelado", variant: "destructive", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = orders?.filter((o) => {
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.customer_phone.includes(search);
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
      queryClient.invalidateQueries({ queryKey: ["admin-all-orders"] });
      toast.success("Status atualizado!");
    },
  });

  const pendingCount = orders?.filter((o) => o.status === "pending").length ?? 0;
  const confirmedCount = orders?.filter((o) => o.status === "confirmed").length ?? 0;
  const totalRevenue = orders?.reduce((s, o) => s + Number(o.total), 0) ?? 0;

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pedidos</h1>
          <p className="admin-page-subtitle">{filtered?.length ?? 0} pedidos</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {pendingCount > 0 && (
            <span className="admin-stat-pill bg-amber-500/10 text-amber-500 border-amber-500/20">
              {pendingCount} pendente(s)
            </span>
          )}
          <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{fmt(totalRevenue)}</span></span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente ou telefone..." className="admin-input pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : !filtered?.length ? (
        <div className="text-center py-16">
          <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_120px_1fr_100px_120px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/30 admin-section-label">
            <span>Cliente</span>
            <span>Data</span>
            <span>Itens</span>
            <span className="text-right">Total</span>
            <span className="text-center">Status</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((order, i) => {
              const items = (order.items as any[]) || [];
              const st = statusMap[order.status] || statusMap.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-1 md:grid-cols-[1fr_120px_1fr_100px_120px] gap-2 md:gap-3 items-center px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <div>
                    <p className="text-[13px] font-medium">{order.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{order.customer_phone}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
                  </span>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {items.map((item: any) => `${item.name} x${item.quantity}`).join(", ")}
                  </div>
                  <span className="text-[13px] font-semibold text-right tabular-nums">{fmt(Number(order.total))}</span>
                  <div className="flex justify-center">
                    <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                      <SelectTrigger className={`w-full h-7 text-[10px] rounded-md border ${st.color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
