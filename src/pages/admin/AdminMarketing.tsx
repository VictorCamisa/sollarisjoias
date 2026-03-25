import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Mail, Instagram, MousePointerClick, BarChart3, TrendingUp, Search, Plus, Send, Eye, Users, ShoppingCart, ExternalLink, Pencil, Check, Clock, AlertTriangle, Globe, FileText, Hash, ArrowUpRight, Target, Zap, Calendar, MessageSquare, Sparkles, Copy, Image, Lightbulb, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Email Campaigns Tab ───
const EmailCampaignsTab = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", message_template: "", segment_status: [] as string[], segment_interest: [] as string[] });

  const { data: campaigns, refetch } = useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscribers } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["marketing-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_leads").select("id, name, email, status, interest");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [campaigns, search]);

  const statusIcon: Record<string, any> = {
    rascunho: <Pencil className="h-3 w-3" />,
    agendada: <Clock className="h-3 w-3" />,
    enviando: <Send className="h-3 w-3" />,
    concluida: <Check className="h-3 w-3" />,
  };
  const statusColor: Record<string, string> = {
    rascunho: "bg-muted text-muted-foreground",
    agendada: "bg-blue-500/10 text-blue-400",
    enviando: "bg-amber-500/10 text-amber-400",
    concluida: "bg-emerald-500/10 text-emerald-400",
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    const { error } = await supabase.from("sales_campaigns").insert({
      name: form.name,
      description: form.description,
      message_template: form.message_template,
      channel: "email",
      segment_status: form.segment_status,
      segment_interest: form.segment_interest,
    });
    if (error) return toast.error("Erro ao criar campanha");
    toast.success("Campanha criada!");
    setDialogOpen(false);
    setForm({ name: "", description: "", message_template: "", segment_status: [], segment_interest: [] });
    refetch();
  };

  const totalSubs = subscribers?.length || 0;
  const totalLeadsWithEmail = leads?.filter(l => l.email).length || 0;
  const totalSent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Inscritos Newsletter", value: totalSubs, icon: Users, color: "text-blue-400" },
          { label: "Leads com E-mail", value: totalLeadsWithEmail, icon: Mail, color: "text-emerald-400" },
          { label: "Campanhas Criadas", value: campaigns?.length || 0, icon: Megaphone, color: "text-purple-400" },
          { label: "E-mails Enviados", value: totalSent, icon: Send, color: "text-amber-400" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><k.icon className={`h-4 w-4 ${k.color}`} /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar campanha..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Nova Campanha</Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(c => (
          <Card key={c.id} className="hover:border-accent/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{c.name}</span>
                  <Badge variant="outline" className={`text-[10px] ${statusColor[c.status] || ""}`}>
                    {statusIcon[c.status]}{" "}{c.status}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">{c.channel}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{c.description || "Sem descrição"}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{c.sent_count || 0} enviados</p>
                <p>{format(new Date(c.created_at), "dd/MM/yy")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma campanha encontrada</p>}
      </div>

      {/* Subscribers list */}
      {totalSubs > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">📬 Inscritos na Newsletter ({totalSubs})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {subscribers?.slice(0, 12).map(s => (
              <Card key={s.id}><CardContent className="p-3 flex items-center justify-between">
                <span className="text-xs truncate">{s.email}</span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(s.created_at), "dd/MM")}</span>
              </CardContent></Card>
            ))}
          </div>
          {totalSubs > 12 && <p className="text-xs text-muted-foreground mt-2 text-center">+ {totalSubs - 12} inscritos</p>}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Campanha de E-mail</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da campanha" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Descrição curta" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Textarea placeholder="Template da mensagem..." value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} rows={5} />
          </div>
          <DialogFooter><Button onClick={handleCreate}>Criar Campanha</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Social Media Tab ───
const SocialMediaTab = () => {
  const [posts, setPosts] = useState<Array<{ id: string; platform: string; content: string; date: string; status: string }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", content: "", date: "" });

  const handleCreate = () => {
    if (!form.content.trim()) return toast.error("Conteúdo é obrigatório");
    setPosts(prev => [...prev, { id: crypto.randomUUID(), ...form, status: form.date ? "agendado" : "rascunho" }]);
    setDialogOpen(false);
    setForm({ platform: "instagram", content: "", date: "" });
    toast.success("Post criado!");
  };

  const platformIcon: Record<string, string> = { instagram: "📸", tiktok: "🎵", facebook: "📘", whatsapp: "💬" };
  const platformColor: Record<string, string> = { instagram: "text-pink-400", tiktok: "text-cyan-400", facebook: "text-blue-400", whatsapp: "text-emerald-400" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Posts Criados", value: posts.length, icon: FileText, color: "text-pink-400" },
          { label: "Agendados", value: posts.filter(p => p.status === "agendado").length, icon: Calendar, color: "text-blue-400" },
          { label: "Rascunhos", value: posts.filter(p => p.status === "rascunho").length, icon: Pencil, color: "text-amber-400" },
          { label: "Plataformas", value: new Set(posts.map(p => p.platform)).size || 0, icon: Globe, color: "text-emerald-400" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><k.icon className={`h-4 w-4 ${k.color}`} /></div>
            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setDialogOpen(true)} className="ml-auto"><Plus className="h-4 w-4 mr-1" />Novo Post</Button>
      </div>

      <div className="space-y-2">
        {posts.map(p => (
          <Card key={p.id} className="hover:border-accent/30 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">{platformIcon[p.platform]}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${platformColor[p.platform]}`}>{p.platform}</span>
                  <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.content}</p>
              </div>
              {p.date && <span className="text-[10px] text-muted-foreground">{p.date}</span>}
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Crie posts para planejar seu conteúdo nas redes sociais</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Post</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">📸 Instagram</SelectItem>
                <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                <SelectItem value="facebook">📘 Facebook</SelectItem>
                <SelectItem value="whatsapp">💬 WhatsApp Status</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Conteúdo / legenda do post..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <DialogFooter><Button onClick={handleCreate}>Criar Post</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Ads Tab ───
const AdsTab = () => {
  const { data: adTransactions } = useQuery({
    queryKey: ["marketing-ad-spend"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("type", "expense")
        .eq("sub_type", "marketing")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["marketing-orders-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, total, created_at, status");
      if (error) throw error;
      return data;
    },
  });

  const totalAdSpend = adTransactions?.reduce((s, t) => s + Number(t.amount), 0) || 0;
  const totalRevenue = orders?.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0) || 0;
  const roas = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(1) : "—";
  const cpa = totalAdSpend > 0 && orders ? (totalAdSpend / orders.length).toFixed(0) : "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Investido em Ads", value: fmtBRL(totalAdSpend), icon: MousePointerClick, color: "text-red-400" },
          { label: "Receita Total", value: fmtBRL(totalRevenue), icon: ShoppingCart, color: "text-emerald-400" },
          { label: "ROAS", value: `${roas}x`, icon: ArrowUpRight, color: "text-blue-400" },
          { label: "CPA Médio", value: typeof cpa === "string" && cpa !== "—" ? fmtBRL(Number(cpa)) : "—", icon: Target, color: "text-amber-400" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><k.icon className={`h-4 w-4 ${k.color}`} /></div>
            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Investimentos em Marketing</CardTitle></CardHeader>
        <CardContent>
          {adTransactions && adTransactions.length > 0 ? (
            <div className="space-y-2">
              {adTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium">{t.description}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yy")} • {t.payment_method}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400">-{fmtBRL(Number(t.amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">Nenhum investimento em marketing registrado</p>
              <p className="text-xs text-muted-foreground">Registre despesas no Financeiro com o sub-tipo "marketing" para rastrear aqui</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">💡 Dicas de Performance</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { tip: "Registre investimentos em anúncios no módulo Financeiro como despesa → sub-tipo 'marketing'", icon: "💰" },
            { tip: "O ROAS (Return on Ad Spend) ideal para joias é acima de 3x", icon: "📊" },
            { tip: "Use UTMs nos links para rastrear a origem das vendas", icon: "🔗" },
            { tip: "Campanhas de remarketing costumam ter o melhor ROAS para e-commerce de joias", icon: "🎯" },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30">
              <span className="text-sm">{t.icon}</span>
              <p className="text-xs text-muted-foreground">{t.tip}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Reports Tab ───
const ReportsTab = () => {
  const { data: orders } = useQuery({
    queryKey: ["marketing-report-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["marketing-report-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_leads").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: subscribers } = useQuery({
    queryKey: ["marketing-report-subs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["marketing-report-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_campaigns").select("*");
      if (error) throw error;
      return data;
    },
  });

  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0) || 0;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalLeads = leads?.length || 0;
  const conversionRate = totalLeads > 0 ? ((totalOrders / totalLeads) * 100).toFixed(1) : "0";

  const now = new Date();
  const thisMonth = orders?.filter(o => new Date(o.created_at).getMonth() === now.getMonth() && new Date(o.created_at).getFullYear() === now.getFullYear()) || [];
  const lastMonth = orders?.filter(o => {
    const d = new Date(o.created_at);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
  }) || [];

  const thisMonthRev = thisMonth.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const lastMonthRev = lastMonth.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const growthPct = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(0) : "—";

  // Lead sources breakdown
  const sourceBreakdown = useMemo(() => {
    if (!leads) return [];
    const map: Record<string, number> = {};
    leads.forEach(l => { map[l.source] = (map[l.source] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Lead status breakdown
  const statusBreakdown = useMemo(() => {
    if (!leads) return [];
    const map: Record<string, number> = {};
    leads.forEach(l => { map[l.status] = (map[l.status] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Receita Total", value: fmtBRL(totalRevenue), icon: ShoppingCart, color: "text-emerald-400" },
          { label: "Ticket Médio", value: fmtBRL(avgTicket), icon: Target, color: "text-blue-400" },
          { label: "Taxa de Conversão", value: `${conversionRate}%`, icon: Zap, color: "text-amber-400" },
          { label: "Crescimento Mensal", value: `${growthPct}%`, icon: TrendingUp, color: "text-purple-400" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><k.icon className={`h-4 w-4 ${k.color}`} /></div>
            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue comparison */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">📅 Comparativo Mensal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">Este mês</span>
              <span className="text-sm font-bold text-emerald-400">{fmtBRL(thisMonthRev)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">Mês anterior</span>
              <span className="text-sm font-bold">{fmtBRL(lastMonthRev)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">Pedidos este mês</span>
              <span className="text-sm font-bold">{thisMonth.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Lead sources */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">📡 Origens de Leads</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sourceBreakdown.length > 0 ? sourceBreakdown.map(([source, count]) => (
              <div key={source} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                <span className="text-xs capitalize">{source}</span>
                <Badge variant="secondary" className="text-[10px]">{count}</Badge>
              </div>
            )) : <p className="text-xs text-muted-foreground text-center py-4">Sem dados de leads</p>}
          </CardContent>
        </Card>

        {/* Lead funnel */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">🔄 Funil de Leads</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {statusBreakdown.map(([status, count]) => {
              const pct = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(0) : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs capitalize">{status}</span>
                    <span className="text-[10px] text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {statusBreakdown.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>}
          </CardContent>
        </Card>

        {/* Campaign performance */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">📣 Campanhas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <span className="text-xs">Total de Campanhas</span>
              <span className="text-sm font-bold">{campaigns?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <span className="text-xs">Concluídas</span>
              <span className="text-sm font-bold">{campaigns?.filter(c => c.status === "concluida").length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <span className="text-xs">E-mails Enviados</span>
              <span className="text-sm font-bold">{campaigns?.reduce((s, c) => s + (c.sent_count || 0), 0) || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <span className="text-xs">Inscritos Newsletter</span>
              <span className="text-sm font-bold">{subscribers?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─── SEO Tab ───
const SeoTab = () => {
  const [search, setSearch] = useState("");

  const { data: products, refetch } = useQuery({
    queryKey: ["marketing-seo-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, description, tags_seo, tags, sku, price").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [seoValue, setSeoValue] = useState("");

  const handleSave = async (productId: string) => {
    const { error } = await supabase.from("products").update({ tags_seo: seoValue }).eq("id", productId);
    if (error) return toast.error("Erro ao salvar SEO");
    toast.success("SEO atualizado!");
    setEditing(null);
    refetch();
  };

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const withSeo = products?.filter(p => p.tags_seo && p.tags_seo.trim().length > 0).length || 0;
  const withoutSeo = (products?.length || 0) - withSeo;
  const withDescription = products?.filter(p => p.description && p.description.trim().length > 20).length || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Produtos", value: products?.length || 0, icon: ShoppingCart, color: "text-blue-400" },
          { label: "Com SEO Tags", value: withSeo, icon: Check, color: "text-emerald-400" },
          { label: "Sem SEO Tags", value: withoutSeo, icon: AlertTriangle, color: "text-red-400" },
          { label: "Com Descrição +20ch", value: withDescription, icon: FileText, color: "text-purple-400" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><k.icon className={`h-4 w-4 ${k.color}`} /></div>
            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

      <div className="space-y-2">
        {filtered.map(p => {
          const hasSeo = p.tags_seo && p.tags_seo.trim().length > 0;
          const hasDesc = p.description && p.description.trim().length > 20;
          const isEditing = editing === p.id;

          return (
            <Card key={p.id} className={`transition-colors ${!hasSeo ? "border-amber-500/20" : "hover:border-accent/30"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{p.name}</span>
                    {p.sku && <Badge variant="secondary" className="text-[10px]">{p.sku}</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasSeo ? <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400">SEO ✓</Badge> : <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400">Sem SEO</Badge>}
                    {hasDesc ? <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400">Desc ✓</Badge> : <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400">Sem Desc</Badge>}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex gap-2 mt-2">
                    <Textarea value={seoValue} onChange={e => setSeoValue(e.target.value)} placeholder="Ex: anel dourado, joia feminina, presente namorada..." rows={2} className="flex-1 text-xs" />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={() => handleSave(p.id)}>Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground truncate flex-1">{hasSeo ? p.tags_seo : "Nenhuma tag SEO configurada"}</p>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(p.id); setSeoValue(p.tags_seo || ""); }}><Pencil className="h-3 w-3 mr-1" />Editar SEO</Button>
                  </div>
                )}

                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-[9px]"><Hash className="h-2.5 w-2.5 mr-0.5" />{t}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto encontrado</p>}
      </div>
    </div>
  );
};

// ─── Main Component ───
const AdminMarketing = () => {
  const [activeTab, setActiveTab] = useState("email");

  return (
    <div className="space-y-6 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center"><Megaphone className="h-5 w-5 text-accent" /></div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Marketing</h1>
          <p className="text-xs text-muted-foreground">Central de campanhas, conteúdo, anúncios e SEO</p>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 w-full justify-start gap-1 flex-wrap h-auto p-1">
          <TabsTrigger value="email" className="text-xs gap-1.5"><Mail className="h-3.5 w-3.5" />E-mail</TabsTrigger>
          <TabsTrigger value="social" className="text-xs gap-1.5"><Instagram className="h-3.5 w-3.5" />Redes Sociais</TabsTrigger>
          <TabsTrigger value="ads" className="text-xs gap-1.5"><MousePointerClick className="h-3.5 w-3.5" />Anúncios</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Relatórios</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs gap-1.5"><TrendingUp className="h-3.5 w-3.5" />SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="email"><EmailCampaignsTab /></TabsContent>
        <TabsContent value="social"><SocialMediaTab /></TabsContent>
        <TabsContent value="ads"><AdsTab /></TabsContent>
        <TabsContent value="reports"><ReportsTab /></TabsContent>
        <TabsContent value="seo"><SeoTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMarketing;
