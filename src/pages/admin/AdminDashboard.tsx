import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, FolderOpen, ShoppingCart, Users, AlertTriangle, TrendingUp, DollarSign, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { data: productCount } = useQuery({
    queryKey: ["admin-product-count"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: categoryCount } = useQuery({
    queryKey: ["admin-category-count"],
    queryFn: async () => {
      const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: orderStats } = useQuery({
    queryKey: ["admin-order-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("status, total, created_at");
      if (error) throw error;
      const total = data?.length || 0;
      const revenue = data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const pending = data?.filter((o) => o.status === "pending").length || 0;
      const thisMonth = data?.filter((o) => {
        const d = new Date(o.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }) || [];
      const monthRevenue = thisMonth.reduce((sum, o) => sum + Number(o.total), 0);
      return { total, revenue, pending, monthRevenue, monthOrders: thisMonth.length };
    },
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity")
        .lt("stock_quantity", 5)
        .order("stock_quantity", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriberCount } = useQuery({
    queryKey: ["admin-subscriber-count"],
    queryFn: async () => {
      const { count } = await supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: async () => {
      const { data: orders } = await supabase.from("orders").select("items");
      if (!orders) return [];
      const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
      orders.forEach((order) => {
        const items = (order.items as any[]) || [];
        items.forEach((item: any) => {
          const key = item.name || "Desconhecido";
          if (!productSales[key]) productSales[key] = { name: key, qty: 0, revenue: 0 };
          productSales[key].qty += item.quantity || 1;
          productSales[key].revenue += (item.price || 0) * (item.quantity || 1);
        });
      });
      return Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    },
  });

  const stats = [
    { label: "Produtos", value: productCount ?? 0, icon: Package, color: "text-blue-500", to: "/admin/produtos" },
    { label: "Categorias", value: categoryCount ?? 0, icon: FolderOpen, color: "text-emerald-500", to: "/admin/categorias" },
    { label: "Pedidos", value: orderStats?.total ?? 0, icon: ShoppingCart, color: "text-orange-500", to: "/admin/pedidos" },
    { label: "Inscritos Newsletter", value: subscriberCount ?? 0, icon: Mail, color: "text-pink-500", to: "/admin/newsletter" },
  ];

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "outline" },
    confirmed: { label: "Confirmado", variant: "default" },
    shipped: { label: "Enviado", variant: "secondary" },
    delivered: { label: "Entregue", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da SOLLARIS</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={stat.to}
              className="block bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Receita Total</span>
          </div>
          <p className="text-2xl font-semibold">
            R$ {(orderStats?.revenue ?? 0).toFixed(2).replace(".", ",")}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Receita Este Mês</span>
          </div>
          <p className="text-2xl font-semibold">
            R$ {(orderStats?.monthRevenue ?? 0).toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{orderStats?.monthOrders ?? 0} pedidos</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Pedidos Pendentes</span>
          </div>
          <p className="text-2xl font-semibold text-amber-500">{orderStats?.pending ?? 0}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alert */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Estoque Baixo
            </h2>
            <Link to="/admin/produtos" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          {!lowStockProducts?.length ? (
            <p className="text-xs text-muted-foreground">Nenhum produto com estoque baixo 🎉</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <Badge variant={p.stock_quantity === 0 ? "destructive" : "outline"} className="text-xs">
                    {p.stock_quantity === 0 ? "Esgotado" : `${p.stock_quantity} un.`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top selling products */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Mais Vendidos
          </h2>
          {!topProducts?.length ? (
            <p className="text-xs text-muted-foreground">Sem dados de vendas ainda.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.qty} vendidos</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">R$ {p.revenue.toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Pedidos Recentes</h2>
          <Link to="/admin/pedidos" className="text-xs text-primary hover:underline">Ver todos</Link>
        </div>
        {!recentOrders?.length ? (
          <p className="text-xs text-muted-foreground">Nenhum pedido ainda.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const st = statusMap[order.status] || statusMap.pending;
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      {" · "}{order.customer_phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                    <span className="text-sm font-semibold">R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
