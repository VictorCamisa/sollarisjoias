import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowLeft, MessageCircle, Crown, Heart, Eye, MapPin, Smartphone,
  ShoppingBag, DollarSign, TrendingUp, Calendar, Globe, Package,
  Star, Activity, MousePointerClick, Mail, Phone, AtSign,
} from "lucide-react";

const fmtBRL = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const fmtDateTime = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const AdminCustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: c360 } = useQuery({
    queryKey: ["customer-360", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("customer_360").select("*").eq("user_id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orders } = useQuery({
    queryKey: ["customer-orders", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("customer_id", id!).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: addresses } = useQuery({
    queryKey: ["customer-addresses", id],
    queryFn: async () => {
      const { data } = await (supabase.from("customer_addresses") as any).select("*").eq("user_id", id!);
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: favorites } = useQuery({
    queryKey: ["customer-favs", id],
    queryFn: async () => {
      const { data } = await (supabase.from("customer_favorites") as any)
        .select("created_at, products(id, name, price, foto_frontal, images, categories(name))")
        .eq("user_id", id!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: sessions } = useQuery({
    queryKey: ["customer-sessions", id],
    queryFn: async () => {
      const { data } = await (supabase.from("analytics_sessions") as any)
        .select("*")
        .eq("user_id", id!)
        .order("started_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: pageviews } = useQuery({
    queryKey: ["customer-pageviews", id],
    queryFn: async () => {
      const { data } = await (supabase.from("analytics_pageviews") as any)
        .select("*")
        .eq("user_id", id!)
        .order("entered_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: productEvents } = useQuery({
    queryKey: ["customer-product-views", id],
    queryFn: async () => {
      const { data } = await (supabase.from("analytics_events") as any)
        .select("*")
        .eq("user_id", id!)
        .eq("event_type", "product_view")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!id,
  });

  if (!c360) {
    return (
      <div className="p-6">
        <button onClick={() => navigate("/admin/clientes")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <p className="text-sm text-muted-foreground">Cliente não encontrado.</p>
      </div>
    );
  }

  // Derive tier
  let tier: { label: string; color: string; icon: any } = { label: "Regular", color: "bg-muted text-muted-foreground border-border", icon: Heart };
  if (c360.total_spent >= 500 || c360.orders_count >= 3) tier = { label: "VIP", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Crown };
  else if (c360.orders_count === 0) tier = { label: "Visitante", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Eye };

  const TierIcon = tier.icon;

  // Aggregated product views
  const viewsByProduct: Record<string, { count: number; name: string; productId: string }> = {};
  for (const ev of productEvents ?? []) {
    if (!ev.product_id) continue;
    if (!viewsByProduct[ev.product_id]) viewsByProduct[ev.product_id] = { count: 0, name: ev.product_name || "Produto", productId: ev.product_id };
    viewsByProduct[ev.product_id].count += 1;
  }
  const topViewed = Object.values(viewsByProduct).sort((a, b) => b.count - a.count).slice(0, 6);

  // Most visited paths
  const pathCount: Record<string, number> = {};
  for (const pv of pageviews ?? []) pathCount[pv.path] = (pathCount[pv.path] || 0) + 1;
  const topPaths = Object.entries(pathCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="max-w-[1400px] space-y-5 p-1">
      <button onClick={() => navigate("/admin/clientes")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para clientes
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="admin-card p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent">
              {(c360.full_name || "?")[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{c360.full_name || "Sem nome"}</h1>
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${tier.color}`}>
                  <TierIcon className="h-3 w-3" /> {tier.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                {c360.email && <span className="flex items-center gap-1"><AtSign className="h-3 w-3" />{c360.email}</span>}
                {c360.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c360.phone}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Cadastrado em {fmtDate(c360.signed_up_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {c360.phone && (
              <a target="_blank" rel="noreferrer" href={`https://wa.me/${c360.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Stat label="LTV" value={fmtBRL(c360.total_spent)} icon={DollarSign} color="text-emerald-400" bg="bg-emerald-400/10" />
        <Stat label="Pedidos" value={c360.orders_count} icon={ShoppingBag} color="text-blue-400" bg="bg-blue-400/10" />
        <Stat label="Ticket Médio" value={fmtBRL(c360.orders_count > 0 ? c360.total_spent / c360.orders_count : 0)} icon={TrendingUp} color="text-accent" bg="bg-accent/10" />
        <Stat label="Favoritos" value={c360.favorites_count} icon={Heart} color="text-pink-400" bg="bg-pink-400/10" />
        <Stat label="Sessões" value={c360.sessions_count} icon={Activity} color="text-violet-400" bg="bg-violet-400/10" />
        <Stat label="Pageviews" value={c360.pageviews_count} icon={MousePointerClick} color="text-cyan-400" bg="bg-cyan-400/10" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Origem */}
        <Section title="Origem & Aquisição" icon={Globe}>
          <Row label="Primeira fonte (UTM)" value={c360.first_utm_source || "—"} />
          <Row label="Meio" value={c360.first_utm_medium || "—"} />
          <Row label="Campanha" value={c360.first_utm_campaign || "—"} />
          <Row label="Referrer" value={c360.first_referrer || "Direto"} />
          <Row label="Landing page" value={c360.first_landing_page || "—"} />
          <Row label="Última visita" value={fmtDateTime(c360.last_seen_at)} />
        </Section>

        {/* Localização & dispositivo */}
        <Section title="Local & Dispositivo (última)" icon={Smartphone}>
          <Row label="Cidade" value={c360.last_city || "—"} />
          <Row label="Região" value={c360.last_region || "—"} />
          <Row label="Dispositivo" value={c360.last_device_type || "—"} />
          <Row label="CPF" value={c360.cpf || "—"} />
          <Row label="Aniversário" value={c360.birthday ? fmtDate(c360.birthday) : "—"} />
          <Row label="Score crédito" value={String(c360.credit_score ?? 100)} />
        </Section>

        {/* Top produtos vistos */}
        <Section title="Mais vistos pelo cliente" icon={Eye}>
          {topViewed.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem visualizações registradas.</p>
          ) : (
            <ul className="space-y-2">
              {topViewed.map((p) => (
                <li key={p.productId} className="flex items-center justify-between text-xs">
                  <Link to={`/admin/produtos`} className="hover:text-accent truncate flex-1">{p.name}</Link>
                  <span className="text-[10px] text-muted-foreground tabular-nums ml-2">{p.count}×</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Páginas mais visitadas */}
        <Section title="Páginas mais visitadas" icon={Globe}>
          {topPaths.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem navegação registrada.</p>
          ) : (
            <ul className="space-y-1.5">
              {topPaths.map(([path, n]) => (
                <li key={path} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1 text-muted-foreground">{path}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums ml-2">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Favoritos */}
        <Section title={`Favoritos (${favorites?.length ?? 0})`} icon={Heart}>
          {(favorites?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum favorito.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {favorites!.map((f: any) => (
                <li key={f.products?.id} className="flex items-center gap-3">
                  {f.products?.foto_frontal || f.products?.images?.[0] ? (
                    <img src={f.products.foto_frontal || f.products.images[0]} alt="" className="h-10 w-10 object-cover rounded" />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{f.products?.name}</p>
                    <p className="text-[10px] text-muted-foreground">{f.products?.categories?.name} · {fmtBRL(Number(f.products?.price || 0))}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Endereços */}
        <Section title={`Endereços (${addresses?.length ?? 0})`} icon={MapPin}>
          {(addresses?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum endereço cadastrado.</p>
          ) : (
            <ul className="space-y-3">
              {addresses!.map((a: any) => (
                <li key={a.id} className="text-xs">
                  <p className="font-medium">{a.label} {a.is_default && <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded ml-1">Padrão</span>}</p>
                  <p className="text-muted-foreground">{a.street}, {a.number}{a.complement ? ` - ${a.complement}` : ""}</p>
                  <p className="text-muted-foreground">{a.neighborhood} · {a.city}/{a.state} · {a.zip}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Pedidos */}
        <Section title={`Pedidos (${orders?.length ?? 0})`} icon={Package} className="lg:col-span-2">
          {(orders?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum pedido.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  <tr><th className="text-left py-2">Data</th><th className="text-left py-2">Pedido</th><th className="text-left py-2">Itens</th><th className="text-left py-2">Pagto</th><th className="text-right py-2">Total</th><th className="text-left py-2">Status</th></tr>
                </thead>
                <tbody>
                  {orders!.map((o: any) => (
                    <tr key={o.id} className="border-t border-border/50">
                      <td className="py-2">{fmtDateTime(o.created_at)}</td>
                      <td className="py-2 font-mono text-[10px]">#{o.id.slice(0, 8)}</td>
                      <td className="py-2">{Array.isArray(o.items) ? o.items.length : 0} item(s)</td>
                      <td className="py-2">{o.payment_method}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{fmtBRL(Number(o.total))}</td>
                      <td className="py-2"><span className="text-[10px] px-2 py-0.5 rounded bg-secondary">{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Sessões recentes */}
        <Section title="Últimas sessões" icon={Activity} className="lg:col-span-2">
          {(sessions?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma sessão.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  <tr><th className="text-left py-2">Início</th><th className="text-left py-2">Pageviews</th><th className="text-left py-2">Origem</th><th className="text-left py-2">Dispositivo</th><th className="text-left py-2">Cidade</th></tr>
                </thead>
                <tbody>
                  {sessions!.slice(0, 15).map((s: any) => (
                    <tr key={s.id} className="border-t border-border/50">
                      <td className="py-2">{fmtDateTime(s.started_at)}</td>
                      <td className="py-2 tabular-nums">{s.pageview_count}</td>
                      <td className="py-2 text-muted-foreground">{s.utm_source || s.referrer || "Direto"}</td>
                      <td className="py-2">{s.device_type || "—"}</td>
                      <td className="py-2">{s.city || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

const Stat = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="admin-card p-3 flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className={`${bg} ${color} p-1.5 rounded-lg`}><Icon className="h-3 w-3" /></div>
    </div>
    <span className="text-lg font-bold tabular-nums">{value}</span>
  </div>
);

const Section = ({ title, icon: Icon, children, className = "" }: any) => (
  <div className={`admin-card p-4 ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-accent" />
      <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-xs font-medium truncate ml-3 max-w-[60%] text-right">{value}</span>
  </div>
);

export default AdminCustomerDetail;
