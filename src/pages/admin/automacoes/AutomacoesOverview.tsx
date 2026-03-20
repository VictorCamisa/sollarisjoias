import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, TrendingUp, CalendarDays, Megaphone, Bot, Kanban, ArrowUpRight, Gem } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#6366f1", "#3b82f6", "#8b5cf6", "#f59e0b", "#f97316", "#10b981", "#ef4444"];

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", instagram: "Instagram", indicacao: "Indicação",
  site: "Site", loja: "Loja", manual: "Manual", outro: "Outro",
};

const STAGE_LABELS: Record<string, string> = {
  novo: "Novo", em_contato: "Em Contato", consultoria: "Consultoria",
  orcamento: "Orçamento", proposta: "Proposta", ganho: "Ganho", perdido: "Perdido",
};

const AutomacoesOverview = () => {
  const { data: leads = [] } = useQuery({
    queryKey: ["sales-leads-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("sales_leads").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["sales-appointments-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("sales_appointments").select("*").gte("scheduled_at", new Date().toISOString()).order("scheduled_at");
      return data || [];
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["sales-campaigns-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("sales_campaigns").select("*");
      return data || [];
    },
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["sales-opp-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("sales_opportunities").select("*, sales_leads(name, interest)");
      return data || [];
    },
  });

  const { data: aiConfig } = useQuery({
    queryKey: ["sales-ai-config-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("sales_ai_config").select("*").single();
      return data;
    },
  });

  // KPIs
  const totalLeads = leads.length;
  const newThisWeek = leads.filter((l: any) => new Date(l.created_at) >= subDays(new Date(), 7)).length;
  const converted = leads.filter((l: any) => l.status === "convertido").length;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;
  const pipelineValue = opportunities.reduce((s: number, o: any) => s + (o.value || 0), 0);
  const activeCampaigns = campaigns.filter((c: any) => c.status === "ativa").length;
  const todayApps = appointments.filter((a: any) =>
    format(new Date(a.scheduled_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  ).length;

  // Lead por fonte
  const sourceData = Object.entries(
    leads.reduce((acc: any, l: any) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({ name: SOURCE_LABELS[key] || key, value }));

  // Pipeline por estágio
  const stageData = Object.entries(
    opportunities.reduce((acc: any, o: any) => {
      acc[o.stage_key] = (acc[o.stage_key] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({ name: STAGE_LABELS[key] || key, total: value }));

  // Leads últimos 7 dias
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = format(d, "yyyy-MM-dd");
    const count = leads.filter((l: any) => format(new Date(l.created_at), "yyyy-MM-dd") === dayStr).length;
    return { day: format(d, "EEE", { locale: ptBR }), leads: count };
  });

  const kpis = [
    { label: "Total de Leads", value: totalLeads, sub: `+${newThisWeek} esta semana`, icon: Users, link: "/admin/automacoes/leads", color: "text-indigo-400" },
    { label: "Pipeline (R$)", value: `R$ ${pipelineValue.toLocaleString("pt-BR")}`, sub: `${opportunities.length} oportunidades`, icon: Kanban, link: "/admin/automacoes/pipeline", color: "text-purple-400" },
    { label: "Taxa de Conversão", value: `${conversionRate}%`, sub: `${converted} convertidos`, icon: TrendingUp, link: "/admin/automacoes/pipeline", color: "text-green-400" },
    { label: "Agendamentos Hoje", value: todayApps, sub: `${appointments.length} próximos`, icon: CalendarDays, link: "/admin/automacoes/agendamentos", color: "text-blue-400" },
    { label: "Campanhas Ativas", value: activeCampaigns, sub: `${campaigns.length} total`, icon: Megaphone, link: "/admin/automacoes/campanhas", color: "text-orange-400" },
    { label: "IA Vendedora", value: aiConfig?.enabled ? "Ativa" : "Inativa", sub: aiConfig?.scenario_key || "—", icon: Bot, link: "/admin/automacoes/ia", color: aiConfig?.enabled ? "text-green-400" : "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Gem className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Vendas & Automações</h1>
          <p className="text-xs text-muted-foreground">Central de inteligência comercial da Sollaris</p>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={kpi.link}>
              <Card className="hover:border-accent/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-lg font-bold tracking-tight">{kpi.value}</div>
                  <div className="text-[10px] font-medium text-foreground/70 mt-0.5">{kpi.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads últimos 7 dias */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Novos Leads — Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={last7} barSize={28}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leads por fonte */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Leads por Origem</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {sourceData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8">Sem dados ainda</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                      {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pipeline + Próximos agendamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline por estágio */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Pipeline por Estágio</CardTitle>
            </CardHeader>
            <CardContent>
              {stageData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Nenhuma oportunidade no pipeline</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stageData} layout="vertical" barSize={16}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximos agendamentos */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Próximos Agendamentos</CardTitle>
              <Link to="/admin/automacoes/agendamentos" className="text-[11px] text-accent hover:underline">Ver todos</Link>
            </CardHeader>
            <CardContent>
              {appointments.slice(0, 5).length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Nenhum agendamento próximo</p>
              ) : (
                <div className="space-y-2">
                  {appointments.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-[12px] font-medium">{a.client_name}</p>
                        <p className="text-[11px] text-muted-foreground">{a.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium">{format(new Date(a.scheduled_at), "dd/MM", { locale: ptBR })}</p>
                        <p className="text-[11px] text-muted-foreground">{format(new Date(a.scheduled_at), "HH:mm")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AutomacoesOverview;
