import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, Users, Eye, ShoppingCart, TrendingUp, MapPin,
  Smartphone, Monitor, Tablet, Clock, ArrowUpRight, Zap,
  Globe, MousePointer2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtTime = (ms: number) => {
  if (ms < 1000) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  return `${h}h atrás`;
};

const DeviceIcon = ({ type }: { type?: string | null }) => {
  if (type === "mobile") return <Smartphone className="h-3 w-3" />;
  if (type === "tablet") return <Tablet className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
};

const PulseDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
  </span>
);

const LiveSiteDashboard = () => {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());

  // Tick a cada 5s pra recalcular "agora"
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  // Sessões ativas (últimos 5min)
  const { data: activeSessions = [] } = useQuery({
    queryKey: ["analytics-active-sessions"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await (supabase.from("analytics_sessions") as any)
        .select("*")
        .gte("last_seen_at", cutoff)
        .order("last_seen_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Carrinhos abertos
  const { data: openCarts = [] } = useQuery({
    queryKey: ["analytics-open-carts"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data } = await (supabase.from("analytics_carts") as any)
        .select("*")
        .eq("is_open", true)
        .gte("updated_at", cutoff)
        .order("updated_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 8000,
  });

  // Pageviews últimas 24h (pra rankings e funil)
  const { data: pageviews24h = [] } = useQuery({
    queryKey: ["analytics-pageviews-24h"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase.from("analytics_pageviews") as any)
        .select("*")
        .gte("entered_at", cutoff)
        .order("entered_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Eventos de produto últimas 24h
  const { data: productEvents24h = [] } = useQuery({
    queryKey: ["analytics-events-24h"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase.from("analytics_events") as any)
        .select("*")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    refetchInterval: 12000,
  });

  // Sessões últimos 7d (pra heatmap e funil)
  const { data: sessions7d = [] } = useQuery({
    queryKey: ["analytics-sessions-7d"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase.from("analytics_sessions") as any)
        .select("*")
        .gte("started_at", cutoff)
        .order("started_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Pedidos pagos últimos 7d (pra fechar funil)
  const { data: paidOrders7d = 0 } = useQuery({
    queryKey: ["analytics-paid-orders-7d"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["paid", "confirmed", "delivered"])
        .gte("created_at", cutoff);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  // Realtime subscriptions
  useEffect(() => {
    const ch = supabase
      .channel("analytics-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytics_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["analytics-active-sessions"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-sessions-7d"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytics_carts" },
        () => queryClient.invalidateQueries({ queryKey: ["analytics-open-carts"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytics_pageviews" },
        () => queryClient.invalidateQueries({ queryKey: ["analytics-pageviews-24h"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytics_events" },
        () => queryClient.invalidateQueries({ queryKey: ["analytics-events-24h"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient]);

  /* ── Derived ── */
  const onlineCount = activeSessions.length;
  const openCartCount = openCarts.length;
  const openCartValue = openCarts.reduce((s: number, c: any) => s + Number(c.total_value || 0), 0);

  const pageviews1h = useMemo(
    () =>
      pageviews24h.filter(
        (p: any) => Date.now() - new Date(p.entered_at).getTime() < 60 * 60 * 1000
      ).length,
    [pageviews24h, now]
  );

  // Top rotas 24h
  const topPaths = useMemo(() => {
    const map = new Map<string, number>();
    pageviews24h.forEach((p: any) => {
      map.set(p.path, (map.get(p.path) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [pageviews24h]);

  // Top produtos vistos 24h
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; views: number; cartAdds: number }>();
    productEvents24h
      .filter((e: any) => e.event_type === "view_product" && e.product_id)
      .forEach((e: any) => {
        const cur = map.get(e.product_id) || { name: e.product_name || "—", views: 0, cartAdds: 0 };
        cur.views++;
        map.set(e.product_id, cur);
      });
    productEvents24h
      .filter((e: any) => e.event_type === "add_to_cart" && e.product_id)
      .forEach((e: any) => {
        const cur = map.get(e.product_id) || { name: e.product_name || "—", views: 0, cartAdds: 0 };
        cur.cartAdds++;
        map.set(e.product_id, cur);
      });
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [productEvents24h]);

  // Funil 7d
  const funnel = useMemo(() => {
    const visits = sessions7d.length;
    const productViews = new Set(
      productEvents24h.filter((e: any) => e.event_type === "view_product").map((e: any) => e.session_id)
    ).size;
    const cartAdds = new Set(
      productEvents24h.filter((e: any) => e.event_type === "add_to_cart").map((e: any) => e.session_id)
    ).size;
    const checkoutOpens = new Set(
      productEvents24h.filter((e: any) => e.event_type === "open_checkout").map((e: any) => e.session_id)
    ).size;
    return { visits, productViews, cartAdds, checkoutOpens, paid: paidOrders7d };
  }, [sessions7d, productEvents24h, paidOrders7d]);

  // Distribuição dispositivo 7d
  const deviceDist = useMemo(() => {
    const map: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    sessions7d.forEach((s: any) => {
      const d = s.device_type || "desktop";
      map[d] = (map[d] || 0) + 1;
    });
    const total = sessions7d.length || 1;
    return Object.entries(map).map(([k, v]) => ({ key: k, count: v, pct: Math.round((v / total) * 100) }));
  }, [sessions7d]);

  // Origem 7d
  const trafficSources = useMemo(() => {
    const map = new Map<string, number>();
    sessions7d.forEach((s: any) => {
      let src = "Direto";
      if (s.utm_source) src = `UTM: ${s.utm_source}`;
      else if (s.referrer) {
        try {
          src = new URL(s.referrer).hostname.replace("www.", "");
        } catch {
          src = "Outro";
        }
      }
      map.set(src, (map.get(src) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [sessions7d]);

  // Heatmap 7d (24h x 7d)
  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    sessions7d.forEach((s: any) => {
      const d = new Date(s.started_at);
      grid[d.getDay()][d.getHours()]++;
    });
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [sessions7d]);

  /* ── Render ── */
  return (
    <div className="space-y-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-card p-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <PulseDot />
              <span className="admin-kpi-label">Online agora</span>
            </div>
            <Users className="h-3 w-3 text-emerald-400" />
          </div>
          <p className="admin-kpi-value text-emerald-400 tabular-nums">{onlineCount}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">visitantes ativos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="admin-card p-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="admin-kpi-label">Pageviews 1h</span>
            <Eye className="h-3 w-3 text-blue-400" />
          </div>
          <p className="admin-kpi-value tabular-nums">{pageviews1h}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{pageviews24h.length} nas últimas 24h</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="admin-card p-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="admin-kpi-label">Carrinhos abertos</span>
            <ShoppingCart className="h-3 w-3 text-amber-400" />
          </div>
          <p className="admin-kpi-value text-amber-400 tabular-nums">{openCartCount}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{fmt(openCartValue)} em jogo</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="admin-card p-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="admin-kpi-label">Visitantes 7d</span>
            <TrendingUp className="h-3 w-3 text-violet-400" />
          </div>
          <p className="admin-kpi-value tabular-nums">{sessions7d.length}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{paidOrders7d} pedidos pagos</p>
        </motion.div>
      </div>

      {/* Funil + Carrinhos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Funil */}
        <div className="admin-card p-4">
          <div className="admin-card-header mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-accent" />
              <h2 className="admin-card-title">Funil de Conversão · 7d</h2>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Visitas", value: funnel.visits, color: "bg-blue-500" },
              { label: "Viu produto", value: funnel.productViews, color: "bg-violet-500" },
              { label: "Adicionou carrinho", value: funnel.cartAdds, color: "bg-amber-500" },
              { label: "Abriu checkout", value: funnel.checkoutOpens, color: "bg-orange-500" },
              { label: "Pagou", value: funnel.paid, color: "bg-emerald-500" },
            ].map((step, i, arr) => {
              const pct = arr[0].value > 0 ? (step.value / arr[0].value) * 100 : 0;
              const dropPct =
                i > 0 && arr[i - 1].value > 0
                  ? Math.round(((arr[i - 1].value - step.value) / arr[i - 1].value) * 100)
                  : 0;
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">{step.label}</span>
                    <div className="flex items-center gap-2">
                      {i > 0 && dropPct > 0 && (
                        <span className="text-red-400/80 text-[9px]">−{dropPct}%</span>
                      )}
                      <span className="font-semibold tabular-nums">{step.value}</span>
                    </div>
                  </div>
                  <div className="h-5 rounded-md bg-secondary/30 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className={`h-full ${step.color} opacity-80 flex items-center justify-end px-2`}
                    >
                      <span className="text-[9px] text-white font-medium">{Math.round(pct)}%</span>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrinhos abertos */}
        <div className="admin-card p-4">
          <div className="admin-card-header mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-3.5 w-3.5 text-amber-400" />
              <h2 className="admin-card-title">Carrinhos Abertos Agora</h2>
            </div>
            <span className="text-[10px] text-muted-foreground">{openCartCount} ativo{openCartCount !== 1 ? "s" : ""}</span>
          </div>
          {openCarts.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/15" />
              <p className="text-[11px] text-muted-foreground">Nenhuma sacola aberta</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              <AnimatePresence>
                {openCarts.slice(0, 10).map((cart: any) => (
                  <motion.div
                    key={cart.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-2 rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-3 w-3 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">
                        {cart.customer_name || `Visitante anônimo`}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {cart.item_count} item{cart.item_count !== 1 ? "s" : ""} · {timeAgo(cart.updated_at)}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-accent tabular-nums">
                      {fmt(Number(cart.total_value))}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Sessões ativas + Top produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Sessões ativas */}
        <div className="admin-card p-4">
          <div className="admin-card-header mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <h2 className="admin-card-title">Visitantes Ativos · Página atual</h2>
            </div>
            <PulseDot />
          </div>
          {activeSessions.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <Users className="h-8 w-8 text-muted-foreground/15" />
              <p className="text-[11px] text-muted-foreground">Nenhum visitante online</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              <AnimatePresence>
                {activeSessions.slice(0, 12).map((s: any) => {
                  const lastPv = pageviews24h.find((pv: any) => pv.session_id === s.session_id);
                  const path = lastPv?.path || s.landing_page || "/";
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/30 transition-colors"
                    >
                      <div className="text-muted-foreground"><DeviceIcon type={s.device_type} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">
                          <span className="text-accent">{path}</span>
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {s.browser || "—"} · {s.os || "—"} · {s.pageview_count} pv
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground flex-shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(s.last_seen_at)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Top produtos */}
        <div className="admin-card p-4">
          <div className="admin-card-header mb-3">
            <div className="flex items-center gap-2">
              <MousePointer2 className="h-3.5 w-3.5 text-violet-400" />
              <h2 className="admin-card-title">Top Produtos · 24h</h2>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <Eye className="h-8 w-8 text-muted-foreground/15" />
              <p className="text-[11px] text-muted-foreground">Sem visualizações ainda</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {topProducts.map((p, i) => {
                const maxViews = topProducts[0].views || 1;
                const pct = (p.views / maxViews) * 100;
                const conv = p.views > 0 ? Math.round((p.cartAdds / p.views) * 100) : 0;
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                        <span className="text-muted-foreground/60 w-3 tabular-nums">{i + 1}</span>
                        <span className="font-medium truncate">{p.name}</span>
                      </span>
                      <span className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                        <span className="text-accent font-semibold tabular-nums">{p.views}</span>
                        {p.cartAdds > 0 && (
                          <span className="text-amber-400 text-[9px]">+{p.cartAdds} carrinho · {conv}%</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-violet-500/70"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top rotas + Origem + Dispositivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Top rotas */}
        <div className="admin-card p-4">
          <div className="admin-card-header mb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <h2 className="admin-card-title">Top Rotas · 24h</h2>
            </div>
          </div>
          {topPaths.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-4 text-center">Sem dados ainda</p>
          ) : (
            <div className="space-y-1.5">
              {topPaths.map(([path, count]) => {
                const max = topPaths[0][1];
                const pct = (count / max) * 100;
                return (
                  <div key={path} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono truncate text-accent">{path}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
                      <div className="h-full bg-blue-500/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Origem */}
        <div className="admin-card p-4">
          <div className="admin-card-header mb-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-400" />
              <h2 className="admin-card-title">Origem · 7d</h2>
            </div>
          </div>
          {trafficSources.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-4 text-center">Sem dados ainda</p>
          ) : (
            <div className="space-y-1.5">
              {trafficSources.map(([src, count]) => {
                const max = trafficSources[0][1];
                const pct = (count / max) * 100;
                return (
                  <div key={src} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="truncate">{src}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
                      <div className="h-full bg-amber-500/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dispositivos */}
        <div className="admin-card p-4">
          <div className="admin-card-header mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              <h2 className="admin-card-title">Dispositivos · 7d</h2>
            </div>
          </div>
          <div className="space-y-2">
            {deviceDist.map((d) => (
              <div key={d.key}>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="flex items-center gap-1.5 capitalize">
                    <DeviceIcon type={d.key} />
                    {d.key}
                  </span>
                  <span className="font-semibold tabular-nums">{d.count} · {d.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                  <div className="h-full bg-emerald-500/70" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap horários */}
      <div className="admin-card p-4">
        <div className="admin-card-header mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-violet-400" />
            <h2 className="admin-card-title">Heatmap de Acessos · 7 dias</h2>
          </div>
          <span className="text-[10px] text-muted-foreground">Quando seus clientes mais navegam</span>
        </div>
        <div className="space-y-1">
          <div className="flex gap-0.5 pl-8">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[8px] text-muted-foreground">
                {h % 4 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => (
            <div key={day} className="flex items-center gap-0.5">
              <span className="w-7 text-[9px] text-muted-foreground text-right">{day}</span>
              <div className="flex gap-0.5 flex-1">
                {heatmap.grid[i].map((count, h) => {
                  const intensity = count / heatmap.max;
                  return (
                    <div
                      key={h}
                      title={`${day} ${h}h: ${count} sessões`}
                      className="flex-1 aspect-square rounded-[2px] transition-colors"
                      style={{
                        backgroundColor:
                          count === 0
                            ? "hsl(var(--secondary) / 0.3)"
                            : `hsl(var(--accent) / ${0.15 + intensity * 0.85})`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveSiteDashboard;
