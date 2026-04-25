import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useStore";
import {
  Package, ShoppingCart, AlertTriangle,
  TrendingUp, DollarSign, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useMemo } from "react";

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

const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md px-2.5 py-1.5 shadow-lg">
      <p className="text-[9px] text-muted-foreground mb-0.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-[13px] font-semibold text-foreground">
          {formatter ? formatter(entry.value) : fmt(entry.value)}
        </p>
      ))}
    </div>
  );
};

/* ─── Compact KPI ─── */
const KpiCard = ({ label, value, icon: Icon, color, to, trend, detail }: any) => (
  <Link to={to} className="admin-card-interactive p-3 flex items-center gap-3">
    <div className={`admin-kpi-icon ${color}`}>
      <Icon className="h-3.5 w-3.5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="admin-kpi-value">{value}</p>
      <p className="admin-kpi-label">{label}</p>
    </div>
    {trend !== undefined && trend !== 0 && (
      <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trend >= 0 ? "text-emerald-500" : "text-red-400"}`}>
        {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(trend).toFixed(0)}%
      </div>
    )}
    {detail && !trend && (
      <span className="text-[10px] text-muted-foreground">{detail}</span>
    )}
  </Link>
);

const AdminDashboard = () => {
  const { data: settings } = useSettings();
  const MONTHLY_GOAL = (settings as any)?.monthly_goal ?? 15000;

  const { data: productCount } = useQuery({
    queryKey: ["admin-product-count"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
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
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

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
        month: `${MONTHS[m]}`,
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
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const goalProgress = Math.min((monthRevenue / MONTHLY_GOAL) * 100, 100);

    return {
      monthlyData, monthRevenue, monthOrderCount, revenueChange,
      totalRevenue, totalOrders, avgTicket, thisMonthAvgTicket,
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
    <div className="space-y-4 max-w-[1200px]">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Visão geral da operação</p>
        </div>
        {(analytics?.pending ?? 0) > 0 && (
          <Link to="/admin/pedidos" className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1 text-[11px] font-medium text-amber-500 hover:bg-amber-500/15 transition">
            <AlertTriangle className="h-3 w-3" />
            {analytics?.pending} pendente(s)
          </Link>
        )}
      </div>

      {/* ─── KPI Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KpiCard label="Receita do mês" value={fmt(analytics?.monthRevenue ?? 0)} icon={DollarSign}
          color="bg-emerald-500/10 text-emerald-500" to="/admin/financeiro" trend={analytics?.revenueChange} />
        <KpiCard label="Ticket médio" value={fmt(analytics?.thisMonthAvgTicket ?? 0)} icon={TrendingUp}
          color="bg-blue-500/10 text-blue-500" to="/admin/pedidos" detail={`Geral: ${fmt(analytics?.avgTicket ?? 0)}`} />
        <KpiCard label="Pedidos do mês" value={analytics?.monthOrderCount ?? 0} icon={ShoppingCart}
          color="bg-orange-500/10 text-orange-500" to="/admin/pedidos" detail={`Total: ${analytics?.totalOrders ?? 0}`} />
        <KpiCard label="Produtos" value={productCount ?? 0} icon={Package}
          color="bg-accent/10 text-accent" to="/admin/produtos" />
      </div>

      {/* ─── Goal + Revenue Chart ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3">
        {/* Revenue Chart */}
        <div className="admin-card p-4">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Faturamento</h2>
              <p className="admin-card-subtitle">Últimos 12 meses</p>
            </div>
            <span className="text-[13px] font-semibold text-accent tabular-nums">{fmt(analytics?.totalRevenue ?? 0)}</span>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyData || []} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_GOLD} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(234, 8%, 15%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(234, 6%, 40%)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 9, fill: "hsl(234, 6%, 40%)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="receita" stroke={CHART_GOLD} strokeWidth={1.5} fill="url(#goldGradient)" dot={false}
                  activeDot={{ r: 3, fill: CHART_GOLD, stroke: "hsl(234, 18%, 7%)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goal Card */}
        <div className="admin-card p-4 flex flex-col">
          <div className="admin-card-header">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-accent" />
              <h2 className="admin-card-title">Meta Mensal</h2>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xl font-bold">{(analytics?.goalProgress ?? 0).toFixed(0)}%</span>
            <span className="text-[10px] text-muted-foreground">atingido</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500 transition-all duration-700"
              style={{ width: `${analytics?.goalProgress ?? 0}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
            <span>{fmt(analytics?.monthRevenue ?? 0)}</span>
            <span>{fmt(MONTHLY_GOAL)}</span>
          </div>
          <div className="flex-1" />
          <div className="text-[10px] text-muted-foreground">
            Faltam <span className="font-semibold text-foreground">{fmt(Math.max(0, MONTHLY_GOAL - (analytics?.monthRevenue ?? 0)))}</span>
          </div>
        </div>
      </div>

      {/* ─── Top Products + Lists ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Top Products */}
        <div className="admin-card p-4 lg:col-span-1">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Mais Vendidos</h2>
          </div>
          {analytics?.topProducts?.length ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(234, 8%, 15%)" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 8, fill: "hsl(234, 6%, 40%)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(0, 0%, 80%)" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" radius={[0, 3, 3, 0]} barSize={16}>
                    {analytics.topProducts.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground py-6 text-center">Sem dados.</p>
          )}
        </div>

        {/* Low stock */}
        <div className="admin-card p-4">
          <div className="admin-card-header">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="admin-card-title">Estoque Baixo</h2>
            </div>
            <Link to="/admin/produtos" className="text-[10px] text-accent hover:text-accent/80 transition-colors">Ver todos →</Link>
          </div>
          {!lowStockProducts?.length ? (
            <p className="text-[11px] text-muted-foreground py-4">Tudo em ordem 🎉</p>
          ) : (
            <div className="divide-y divide-border/50">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium truncate">{p.name}</p>
                    {p.sku && <p className="text-[9px] text-muted-foreground font-mono">{p.sku}</p>}
                  </div>
                  <Badge variant={p.stock_quantity === 0 ? "destructive" : "outline"} className="text-[9px] ml-2 shrink-0">
                    {p.stock_quantity === 0 ? "Esgotado" : `${p.stock_quantity} un.`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="admin-card p-4">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Últimos Pedidos</h2>
            <Link to="/admin/pedidos" className="text-[10px] text-accent hover:text-accent/80 transition-colors">Ver todos →</Link>
          </div>
          {!recentOrders?.length ? (
            <p className="text-[11px] text-muted-foreground py-4">Nenhum pedido ainda.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {recentOrders.map((order) => {
                const st = statusMap[order.status] || statusMap.pending;
                return (
                  <div key={order.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium truncate">{order.customer_name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <Badge variant={st.variant} className="text-[9px]">{st.label}</Badge>
                      <span className="text-[12px] font-semibold tabular-nums">{fmt(Number(order.total))}</span>
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
