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
import { useMemo } from "react";

/* ─── helpers ─── */
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtShort = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
};

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CHART_GOLD = "hsl(39, 41%, 70%)";
const CHART_EMERALD = "hsl(152, 57%, 58%)";
const CHART_BLUE = "hsl(217, 91%, 60%)";
const CHART_ORANGE = "hsl(25, 95%, 53%)";
const CHART_PINK = "hsl(330, 81%, 60%)";
const BAR_COLORS = [CHART_GOLD, CHART_EMERALD, CHART_BLUE, CHART_ORANGE, CHART_PINK];

/* ─── custom tooltip ─── */
const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-foreground">
          {formatter ? formatter(entry.value) : fmt(entry.value)}
        </p>
      ))}
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ label, value, icon: Icon, color, to, subtitle, trend }: any) => (
  <Link to={to} className="group block">
    <div className="admin-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend >= 0 ? "text-emerald-500" : "text-red-400"}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight font-sans">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/50 mt-0.5">{subtitle}</p>}
    </div>
  </Link>
);

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { data: settings } = useSettings();
  const MONTHLY_GOAL = (settings as any)?.monthly_goal ?? 15000;

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

    const thisMonthOrders = allOrders.filter((o) => {
      const od = new Date(o.created_at);
      return od.getMonth() === currentMonth && od.getFullYear() === currentYear;
    });
    const monthRevenue = thisMonthOrders.reduce((s, o) => s + Number(o.total), 0);
    const monthOrderCount = thisMonthOrders.length;

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthOrders = allOrders.filter((o) => {
      const od = new Date(o.created_at);
      return od.getMonth() === lastMonth && od.getFullYear() === lastYear;
    });
    const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + Number(o.total), 0);
    const revenueChange = lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : monthRevenue > 0 ? 100 : 0;

    const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = allOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const thisMonthAvgTicket = monthOrderCount > 0 ? monthRevenue / monthOrderCount : 0;
    const pending = allOrders.filter((o) => o.status === "pending").length;

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

    const ticketData = monthlyData.map((m) => ({
      ...m,
      ticket: m.pedidos > 0 ? m.receita / m.pedidos : 0,
    }));

    const goalProgress = Math.min((monthRevenue / MONTHLY_GOAL) * 100, 100);

    return {
      monthlyData, ticketData, monthRevenue, monthOrderCount, lastMonthRevenue,
      revenueChange, totalRevenue, totalOrders, avgTicket, thisMonthAvgTicket,
      pending, topProducts, goalProgress,
    };
  }, [allOrders, MONTHLY_GOAL]);

  const recentOrders = useMemo(() => {
    if (!allOrders) return [];
    return [...allOrders].reverse().slice(0, 5);
  }, [allOrders]);

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "outline" },
    confirmed: { label: "Confirmado", variant: "default" },
    shipped: { label: "Enviado", variant: "secondary" },
    delivered: { label: "Entregue", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Visão geral da operação</p>
        </div>
        {(analytics?.pending ?? 0) > 0 && (
          <Link to="/admin/pedidos" className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-500 hover:bg-amber-500/15 transition">
            <AlertTriangle className="h-3.5 w-3.5" />
            {analytics?.pending} pendente(s)
          </Link>
        )}
      </div>

      {/* ─── KPI Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard label="Receita do mês" value={fmt(analytics?.monthRevenue ?? 0)} icon={DollarSign}
            color="bg-emerald-500/10 text-emerald-500" to="/admin/financeiro" trend={analytics?.revenueChange}
            subtitle={`${analytics?.monthOrderCount ?? 0} pedidos`}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard label="Ticket médio" value={fmt(analytics?.thisMonthAvgTicket ?? 0)} icon={TrendingUp}
            color="bg-blue-500/10 text-blue-500" to="/admin/pedidos"
            subtitle={`Geral: ${fmt(analytics?.avgTicket ?? 0)}`}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard label="Total de pedidos" value={analytics?.totalOrders ?? 0} icon={ShoppingCart}
            color="bg-orange-500/10 text-orange-500" to="/admin/pedidos"
            subtitle={`${analytics?.monthOrderCount ?? 0} este mês`}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard label="Produtos cadastrados" value={productCount ?? 0} icon={Package}
            color="bg-accent/10 text-accent" to="/admin/produtos"
            subtitle={`${categoryCount ?? 0} categorias · ${subscriberCount ?? 0} inscritos`}
          />
        </motion.div>
      </div>

      {/* ─── Goal Progress Bar ─── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold">Meta Mensal</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {fmt(analytics?.monthRevenue ?? 0)} / {fmt(MONTHLY_GOAL)}
          </span>
        </div>
        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analytics?.goalProgress ?? 0}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">{(analytics?.goalProgress ?? 0).toFixed(0)}% atingido</span>
          <span className="text-[10px] text-muted-foreground">
            Faltam {fmt(Math.max(0, MONTHLY_GOAL - (analytics?.monthRevenue ?? 0)))}
          </span>
        </div>
      </motion.div>

      {/* ─── Charts row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Faturamento</h2>
              <p className="text-[10px] text-muted-foreground">Últimos 12 meses</p>
            </div>
            <span className="text-xs font-semibold text-accent">{fmt(analytics?.totalRevenue ?? 0)}</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_GOLD} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(234, 8%, 15%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(234, 6%, 45%)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 9, fill: "hsl(234, 6%, 45%)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="receita" stroke={CHART_GOLD} strokeWidth={2} fill="url(#goldGradient)" dot={false}
                  activeDot={{ r: 4, fill: CHART_GOLD, stroke: "hsl(234, 18%, 7%)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ticket Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Ticket Médio</h2>
              <p className="text-[10px] text-muted-foreground">Evolução mensal</p>
            </div>
            <span className="text-xs font-semibold text-emerald-500">{fmt(analytics?.avgTicket ?? 0)}</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.ticketData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_EMERALD} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_EMERALD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(234, 8%, 15%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(234, 6%, 45%)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 9, fill: "hsl(234, 6%, 45%)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="ticket" stroke={CHART_EMERALD} strokeWidth={2} fill="url(#emeraldGradient)" dot={false}
                  activeDot={{ r: 4, fill: CHART_EMERALD, stroke: "hsl(234, 18%, 7%)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ─── Top Products + Goal Gauge ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Produtos Mais Vendidos</h2>
              <p className="text-[10px] text-muted-foreground">Por receita gerada</p>
            </div>
          </div>
          {analytics?.topProducts?.length ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(234, 8%, 15%)" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 9, fill: "hsl(234, 6%, 45%)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(0, 0%, 85%)" }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                    {analytics.topProducts.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.8} />
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-accent" /> Meta do Mês
          </h2>
          <p className="text-[10px] text-muted-foreground mb-3">{fmt(MONTHLY_GOAL)}</p>
          <div className="h-[160px] w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: analytics?.goalProgress ?? 0 },
                    { value: Math.max(0, 100 - (analytics?.goalProgress ?? 0)) },
                  ]}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={68}
                  startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}
                >
                  <Cell fill={CHART_GOLD} />
                  <Cell fill="hsl(234, 8%, 15%)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-2xl font-bold -mt-[102px] mb-[58px]">
            {(analytics?.goalProgress ?? 0).toFixed(0)}%
          </p>
          <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold">{fmt(analytics?.monthRevenue ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">
              Faltam {fmt(Math.max(0, MONTHLY_GOAL - (analytics?.monthRevenue ?? 0)))}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Bottom Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low stock */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Estoque Baixo
            </h2>
            <Link to="/admin/produtos" className="text-[10px] text-accent hover:underline">Ver todos</Link>
          </div>
          {!lowStockProducts?.length ? (
            <p className="text-xs text-muted-foreground py-4">Tudo em ordem 🎉</p>
          ) : (
            <div className="divide-y divide-border">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[13px] font-medium">{p.name}</p>
                    {p.sku && <p className="text-[10px] text-muted-foreground">{p.sku}</p>}
                  </div>
                  <Badge variant={p.stock_quantity === 0 ? "destructive" : "outline"} className="text-[10px]">
                    {p.stock_quantity === 0 ? "Esgotado" : `${p.stock_quantity} un.`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Últimos Pedidos</h2>
            <Link to="/admin/pedidos" className="text-[10px] text-accent hover:underline">Ver todos</Link>
          </div>
          {!recentOrders?.length ? (
            <p className="text-xs text-muted-foreground py-4">Nenhum pedido ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => {
                const st = statusMap[order.status] || statusMap.pending;
                return (
                  <div key={order.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-[13px] font-medium">{order.customer_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        {" · "}{order.customer_phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                      <span className="text-[13px] font-semibold tabular-nums">{fmt(Number(order.total))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
