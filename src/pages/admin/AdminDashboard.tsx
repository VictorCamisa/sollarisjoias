import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useStore";
import {
  Package, FolderOpen, ShoppingCart, Users, AlertTriangle,
  TrendingUp, DollarSign, Mail, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { useMemo, useState } from "react";

/* ─── helpers ─── */
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtShort = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
};

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CHART_GOLD = "hsl(39, 41%, 70%)";
const CHART_GOLD_LIGHT = "hsl(39, 35%, 80%)";
const CHART_EMERALD = "hsl(152, 57%, 58%)";
const CHART_BLUE = "hsl(217, 91%, 60%)";
const CHART_ORANGE = "hsl(25, 95%, 53%)";
const CHART_PINK = "hsl(330, 81%, 60%)";
const BAR_COLORS = [CHART_GOLD, CHART_EMERALD, CHART_BLUE, CHART_ORANGE, CHART_PINK];

/* ─── custom tooltip ─── */
const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-4 py-2.5 shadow-lg">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-foreground">
          {formatter ? formatter(entry.value) : fmt(entry.value)}
        </p>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
const AdminDashboard = () => {

  /* ─── queries ─── */
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

  const { data: subscriberCount } = useQuery({
    queryKey: ["admin-subscriber-count"],
    queryFn: async () => {
      const { count } = await supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: allOrders } = useQuery({
    queryKey: ["admin-all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
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

  /* ─── derived data ─── */
  const analytics = useMemo(() => {
    if (!allOrders) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Monthly revenue for last 12 months
    const monthlyData: { month: string; receita: number; pedidos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthOrders = allOrders.filter((o) => {
        const od = new Date(o.created_at);
        return od.getMonth() === m && od.getFullYear() === y;
      });
      monthlyData.push({
        month: `${MONTHS[m]}/${String(y).slice(2)}`,
        receita: monthOrders.reduce((s, o) => s + Number(o.total), 0),
        pedidos: monthOrders.length,
      });
    }

    // This month stats
    const thisMonthOrders = allOrders.filter((o) => {
      const od = new Date(o.created_at);
      return od.getMonth() === currentMonth && od.getFullYear() === currentYear;
    });
    const monthRevenue = thisMonthOrders.reduce((s, o) => s + Number(o.total), 0);
    const monthOrderCount = thisMonthOrders.length;

    // Last month
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthOrders = allOrders.filter((o) => {
      const od = new Date(o.created_at);
      return od.getMonth() === lastMonth && od.getFullYear() === lastYear;
    });
    const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + Number(o.total), 0);

    // Revenue change
    const revenueChange = lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : monthRevenue > 0 ? 100 : 0;

    // Total
    const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = allOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const thisMonthAvgTicket = monthOrderCount > 0 ? monthRevenue / monthOrderCount : 0;

    // Pending
    const pending = allOrders.filter((o) => o.status === "pending").length;

    // Top products
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    allOrders.forEach((order) => {
      const items = (order.items as any[]) || [];
      items.forEach((item: any) => {
        const key = item.name || "Desconhecido";
        if (!productSales[key]) productSales[key] = { name: key, qty: 0, revenue: 0 };
        productSales[key].qty += item.quantity || 1;
        productSales[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    // Ticket médio por mês
    const ticketData = monthlyData.map((m) => ({
      ...m,
      ticket: m.pedidos > 0 ? m.receita / m.pedidos : 0,
    }));

    // Goal progress
    const goalProgress = Math.min((monthRevenue / MONTHLY_GOAL) * 100, 100);

    return {
      monthlyData,
      ticketData,
      monthRevenue,
      monthOrderCount,
      lastMonthRevenue,
      revenueChange,
      totalRevenue,
      totalOrders,
      avgTicket,
      thisMonthAvgTicket,
      pending,
      topProducts,
      goalProgress,
    };
  }, [allOrders]);

  const recentOrders = useMemo(() => {
    if (!allOrders) return [];
    return [...allOrders].reverse().slice(0, 5);
  }, [allOrders]);

  const stats = [
    { label: "Produtos", value: productCount ?? 0, icon: Package, color: "text-blue-500", to: "/admin/produtos" },
    { label: "Categorias", value: categoryCount ?? 0, icon: FolderOpen, color: "text-emerald-500", to: "/admin/categorias" },
    { label: "Pedidos", value: analytics?.totalOrders ?? 0, icon: ShoppingCart, color: "text-orange-500", to: "/admin/pedidos" },
    { label: "Newsletter", value: subscriberCount ?? 0, icon: Mail, color: "text-pink-500", to: "/admin/newsletter" },
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

      {/* ─── Stats cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={stat.to} className="block bg-card border border-border rounded-2xl p-5 hover:border-accent/30 transition">
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

      {/* ─── Revenue + Goal + Ticket ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Revenue this month */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Receita do Mês</span>
            </div>
            {analytics && analytics.revenueChange !== 0 && (
              <div className={`flex items-center gap-0.5 text-[11px] font-medium ${analytics.revenueChange >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                {analytics.revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(analytics.revenueChange).toFixed(0)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-semibold">{fmt(analytics?.monthRevenue ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{analytics?.monthOrderCount ?? 0} pedidos</p>
        </motion.div>

        {/* Goal progress */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">Meta Mensal</span>
          </div>
          <p className="text-2xl font-semibold">{(analytics?.goalProgress ?? 0).toFixed(0)}%</p>
          <div className="w-full h-2 bg-secondary rounded-full mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analytics?.goalProgress ?? 0}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${CHART_GOLD}, ${CHART_EMERALD})` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {fmt(analytics?.monthRevenue ?? 0)} de {fmt(MONTHLY_GOAL)}
          </p>
        </motion.div>

        {/* Ticket médio */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Ticket Médio</span>
          </div>
          <p className="text-2xl font-semibold">{fmt(analytics?.thisMonthAvgTicket ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Geral: {fmt(analytics?.avgTicket ?? 0)}
          </p>
        </motion.div>
      </div>

      {/* ─── Charts row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Area Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-1">Vendas por Mês</h2>
          <p className="text-xs text-muted-foreground mb-6">Últimos 12 meses</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyData || []} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_GOLD} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(234, 8%, 18%)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "hsl(234, 6%, 55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmtShort(v)}
                  tick={{ fontSize: 10, fill: "hsl(234, 6%, 55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke={CHART_GOLD}
                  strokeWidth={2.5}
                  fill="url(#goldGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: CHART_GOLD, stroke: "hsl(234, 18%, 7%)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ticket Médio Line Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-1">Ticket Médio Mensal</h2>
          <p className="text-xs text-muted-foreground mb-6">Evolução do valor médio por pedido</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.ticketData || []} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_EMERALD} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_EMERALD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(234, 8%, 18%)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "hsl(234, 6%, 55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmtShort(v)}
                  tick={{ fontSize: 10, fill: "hsl(234, 6%, 55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="ticket"
                  stroke={CHART_EMERALD}
                  strokeWidth={2.5}
                  fill="url(#emeraldGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: CHART_EMERALD, stroke: "hsl(234, 18%, 7%)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ─── Top Products + Goal Gauge ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Produtos Mais Vendidos
          </h2>
          <p className="text-xs text-muted-foreground mb-6">Por receita gerada</p>
          {analytics?.topProducts?.length ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(234, 8%, 18%)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => fmtShort(v)}
                    tick={{ fontSize: 10, fill: "hsl(234, 6%, 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(0, 0%, 92%)" }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={24}>
                    {analytics.topProducts.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-10 text-center">Sem dados de vendas ainda.</p>
          )}
        </motion.div>

        {/* Goal Gauge */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            Meta do Mês
          </h2>
          <p className="text-xs text-muted-foreground mb-4">{fmt(MONTHLY_GOAL)}</p>
          <div className="h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: analytics?.goalProgress ?? 0 },
                    { value: Math.max(0, 100 - (analytics?.goalProgress ?? 0)) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={CHART_GOLD} />
                  <Cell fill="hsl(234, 8%, 18%)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-3xl font-semibold -mt-[115px] mb-[70px]">
            {(analytics?.goalProgress ?? 0).toFixed(0)}%
          </p>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">{fmt(analytics?.monthRevenue ?? 0)}</p>
            <p className="text-xs text-muted-foreground">
              Faltam {fmt(Math.max(0, MONTHLY_GOAL - (analytics?.monthRevenue ?? 0)))}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Low Stock + Recent Orders ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Estoque Baixo
            </h2>
            <Link to="/admin/produtos" className="text-xs text-accent hover:underline">Ver todos</Link>
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

        {/* Recent orders */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Pedidos Recentes</h2>
            <Link to="/admin/pedidos" className="text-xs text-accent hover:underline">Ver todos</Link>
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
                      <span className="text-sm font-semibold">{fmt(Number(order.total))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pending alert */}
      {(analytics?.pending ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Você tem {analytics?.pending} pedido(s) pendente(s)</p>
            <Link to="/admin/pedidos" className="text-xs text-accent hover:underline">Ver pedidos →</Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
