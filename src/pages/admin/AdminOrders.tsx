import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  confirmed: { label: "Confirmado", variant: "default" },
  shipped: { label: "Enviado", variant: "secondary" },
  delivered: { label: "Entregue", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
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
      queryClient.invalidateQueries({ queryKey: ["admin-order-stats"] });
      toast.success("Status atualizado!");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-serif font-semibold">Pedidos</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Pedidos</h1>
        <p className="text-xs text-muted-foreground mt-1">{filtered?.length ?? 0} pedidos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente ou telefone..." className="rounded-xl pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!filtered?.length ? (
        <p className="text-sm text-muted-foreground text-center py-10">Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const items = (order.items as any[]) || [];
            const st = statusMap[order.status] || statusMap.pending;
            return (
              <div key={order.id} className="border border-border rounded-xl p-4 space-y-3 bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                    {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  {items.map((item: any, i: number) => (
                    <p key={i}>
                      {item.name} {item.size ? `— ${item.size}` : ""}{item.color ? `/${item.color}` : ""} x{item.quantity} — R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="font-semibold">Total: R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
                </div>

                {order.notes && (
                  <p className="text-xs text-muted-foreground italic border-t border-border pt-2">📝 {order.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
