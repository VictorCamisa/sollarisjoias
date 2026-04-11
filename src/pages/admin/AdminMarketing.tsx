import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Mail, Instagram, MousePointerClick, BarChart3, TrendingUp, Search, Plus, Send, Eye, Users, ShoppingCart, ExternalLink, Pencil, Check, Clock, AlertTriangle, Globe, FileText, Hash, ArrowUpRight, Target, Zap, Calendar, MessageSquare, Sparkles, Copy, Image, Lightbulb, Loader2, Download, ImagePlus, Package, CheckCircle, Ban, Trash2, BookOpen } from "lucide-react";
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

// ─── Brand Assets Panel ───
const BrandAssetsPanel = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [newAsset, setNewAsset] = useState({ type: "rule", title: "", content: "", file_url: "" });
  const [uploading, setUploading] = useState(false);

  const { data: assets, isLoading } = useQuery({
    queryKey: ["brand-assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brand_assets").select("*").order("type").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `brand/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao fazer upload"); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    setNewAsset(a => ({ ...a, file_url: pub.publicUrl }));
    toast.success("Arquivo enviado!");
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!newAsset.title.trim()) return toast.error("Título é obrigatório");
    const { error } = await supabase.from("brand_assets").insert({
      type: newAsset.type,
      title: newAsset.title,
      content: newAsset.content || null,
      file_url: newAsset.file_url || null,
    } as any);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Ativo de marca adicionado!");
    setNewAsset({ type: "rule", title: "", content: "", file_url: "" });
    queryClient.invalidateQueries({ queryKey: ["brand-assets"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("brand_assets").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Removido!");
    queryClient.invalidateQueries({ queryKey: ["brand-assets"] });
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("brand_assets").update({ is_active: !current } as any).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    queryClient.invalidateQueries({ queryKey: ["brand-assets"] });
  };

  const typeLabels: Record<string, { label: string; emoji: string }> = {
    logo: { label: "Logo", emoji: "🎨" },
    manual: { label: "Manual de Marca", emoji: "📖" },
    reference: { label: "Referência Visual", emoji: "📸" },
    rule: { label: "Regra de Criação", emoji: "📋" },
    palette: { label: "Paleta de Cores", emoji: "🎨" },
    typography: { label: "Tipografia", emoji: "✏️" },
    tone: { label: "Tom de Voz", emoji: "🗣️" },
  };

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    (assets || []).forEach(a => {
      if (!groups[a.type]) groups[a.type] = [];
      groups[a.type].push(a);
    });
    return groups;
  }, [assets]);

  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            Central de Marca — Assets & Diretrizes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
        </div>
        <p className="text-xs text-muted-foreground">Tudo que você adicionar aqui será usado pela IA ao gerar posts. Logo, manual, referências visuais, regras de criação e tom de voz.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new asset */}
        <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
          <p className="text-xs font-semibold">Adicionar novo ativo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={newAsset.type} onValueChange={v => setNewAsset(a => ({ ...a, type: v }))}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Título (ex: Logo principal, Regra de hashtags)"
              value={newAsset.title}
              onChange={e => setNewAsset(a => ({ ...a, title: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>
          <Textarea
            placeholder="Conteúdo / descrição / regras (a IA vai ler este texto)..."
            value={newAsset.content}
            onChange={e => setNewAsset(a => ({ ...a, content: e.target.value }))}
            rows={3}
            className="text-xs"
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Button variant="outline" size="sm" className="text-xs" asChild disabled={uploading}>
                <span>{uploading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Enviando...</> : <><ImagePlus className="h-3 w-3 mr-1" />Upload Arquivo</>}</span>
              </Button>
              <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleUpload} />
            </label>
            {newAsset.file_url && (
              <Badge variant="secondary" className="text-[10px] truncate max-w-[200px]">
                ✅ Arquivo anexado
              </Badge>
            )}
            <Button size="sm" className="ml-auto text-xs" onClick={handleAdd} disabled={!newAsset.title.trim()}>
              <Plus className="h-3 w-3 mr-1" />Adicionar
            </Button>
          </div>
        </div>

        {/* Existing assets */}
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">Nenhum ativo cadastrado. Adicione sua logo, manual de marca e regras de criação para que a IA produza posts incríveis.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  {typeLabels[type]?.emoji} {typeLabels[type]?.label || type}
                </p>
                <div className="space-y-1.5">
                  {items.map((a: any) => (
                    <div key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${a.is_active ? "bg-secondary/30 border-accent/10" : "bg-muted/30 border-border opacity-60"}`}>
                      {a.file_url && (
                        a.file_url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                          <img src={a.file_url} alt={a.title} className="h-10 w-10 rounded-md object-cover border border-accent/20" />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-accent/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-accent" />
                          </div>
                        )
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{a.title}</p>
                        {a.content && <p className="text-[10px] text-muted-foreground line-clamp-1">{a.content}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={a.is_active ? "Desativar" : "Ativar"} onClick={() => handleToggle(a.id, a.is_active)}>
                          {a.is_active ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Ban className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" title="Excluir" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── AI Post Creator Tab ───
const CreatePostTab = () => {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("padrao");
  const [postStyle, setPostStyle] = useState<"dark" | "light" | "auto">("auto");
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showBrandAssets, setShowBrandAssets] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<{
    caption: string;
    hashtags: string[];
    platform_tips: string;
    visual_suggestion: string;
    best_time: string;
  } | null>(null);
  const [history, setHistory] = useState<Array<any>>([]);

  const { data: products } = useQuery({
    queryKey: ["post-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, price, original_price, foto_frontal, foto_lifestyle, images, banho, pedra, material").eq("stock_status", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: brandAssets } = useQuery({
    queryKey: ["brand-assets-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brand_assets").select("*").eq("is_active", true).order("type");
      if (error) throw error;
      return data;
    },
  });

  const selectedProduct = useMemo(() => products?.find(p => p.id === selectedProductId), [products, selectedProductId]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Descreva o que deseja para o post");
    setLoading(true);
    setGeneratedPost(null);
    setGeneratedImage(null);

    // Build brand context from assets
    const brandContext = (brandAssets || []).map(a => {
      let line = `[${a.type.toUpperCase()}] ${a.title}`;
      if (a.content) line += `: ${a.content}`;
      if (a.file_url) line += ` (arquivo: ${a.file_url})`;
      return line;
    }).join("\n");

    try {
      // Generate text
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: { prompt, platform, tone, brandContext },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const post = data.post;
      setGeneratedPost(post);
      setHistory(prev => [{ ...post, platform, prompt, image: null }, ...prev].slice(0, 10));
      toast.success("Post gerado com a identidade SOLLARIS! ✨");

      // Generate image automatically
      setImageLoading(true);
      try {
        const resolvedStyle = postStyle === "auto" ? (postCount % 2 === 0 ? "dark" : "light") : postStyle;
        const { data: imgData, error: imgErr } = await supabase.functions.invoke("generate-post-image", {
          body: { prompt, platform, productId: (selectedProductId && selectedProductId !== "none") ? selectedProductId : undefined, caption: post.caption, style: resolvedStyle, brandContext },
        });
        if (imgErr) throw imgErr;
        if (imgData?.error) { toast.error(imgData.error); return; }
        if (imgData?.image_url) {
          setGeneratedImage(imgData.image_url);
          setPostCount(prev => prev + 1);
          setHistory(prev => {
            const updated = [...prev];
            if (updated[0]) updated[0] = { ...updated[0], image: imgData.image_url };
            return updated;
          });
          toast.success("Imagem do post gerada! 🎨");
        }
      } catch (imgE: any) {
        console.error("Image gen error:", imgE);
        toast.error("Texto gerado, mas houve um erro na imagem. Tente gerar novamente.");
      } finally {
        setImageLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar post. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!generatedPost) return;
    setImageLoading(true);
    try {
      const resolvedStyle = postStyle === "auto" ? (postCount % 2 === 0 ? "dark" : "light") : postStyle;
      const brandContext = (brandAssets || []).map(a => {
        let line = `[${a.type.toUpperCase()}] ${a.title}`;
        if (a.content) line += `: ${a.content}`;
        return line;
      }).join("\n");
      const { data: imgData, error: imgErr } = await supabase.functions.invoke("generate-post-image", {
        body: { prompt, platform, productId: (selectedProductId && selectedProductId !== "none") ? selectedProductId : undefined, caption: generatedPost.caption, style: resolvedStyle, brandContext },
      });
      if (imgErr) throw imgErr;
      if (imgData?.error) { toast.error(imgData.error); return; }
      if (imgData?.image_url) {
        setGeneratedImage(imgData.image_url);
        toast.success("Nova imagem gerada! 🎨");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao regerar imagem.");
    } finally {
      setImageLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const copyFullPost = () => {
    if (!generatedPost) return;
    const full = `${generatedPost.caption}\n\n${generatedPost.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ")}`;
    copyToClipboard(full);
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `sollaris-post-${platform.toLowerCase()}-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const platformEmoji: Record<string, string> = { Instagram: "📸", TikTok: "🎵", Facebook: "📘", WhatsApp: "💬", LinkedIn: "💼" };
  const productThumb = (p: any) => p.foto_frontal || p.foto_lifestyle || (p.images && p.images[0]) || "";

  return (
    <div className="space-y-4">
      {/* Input area */}
      <Card className="border-accent/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Gerador de Posts com IA — Identidade SOLLARIS
          </CardTitle>
          <p className="text-xs text-muted-foreground">Descreva sua ideia, selecione um produto do estoque e a IA cria texto + imagem profissional</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Ex: Post sobre o lançamento da nova coleção de anéis com pedra turmalina rosa, focando na exclusividade e no significado da pedra..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            className="resize-none"
          />

          {/* Product selector */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Package className="h-3 w-3" /> Produto do estoque (opcional — a IA usa foto e preço reais)
            </p>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto do estoque..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="none">Sem produto específico</SelectItem>
                {products?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {fmtBRL(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Product preview */}
            {selectedProduct && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border border-accent/10">
                {productThumb(selectedProduct) && (
                  <img src={productThumb(selectedProduct)} alt={selectedProduct.name} className="h-14 w-14 rounded-lg object-cover border border-accent/20" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{selectedProduct.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-accent">{fmtBRL(selectedProduct.price)}</span>
                    {selectedProduct.original_price && (
                      <span className="text-[10px] text-muted-foreground line-through">{fmtBRL(selectedProduct.original_price)}</span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {selectedProduct.banho && <Badge variant="secondary" className="text-[9px]">{selectedProduct.banho}</Badge>}
                    {selectedProduct.pedra && <Badge variant="secondary" className="text-[9px]">{selectedProduct.pedra}</Badge>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Instagram">📸 Instagram</SelectItem>
                <SelectItem value="TikTok">🎵 TikTok</SelectItem>
                <SelectItem value="Facebook">📘 Facebook</SelectItem>
                <SelectItem value="WhatsApp">💬 WhatsApp</SelectItem>
                <SelectItem value="LinkedIn">💼 LinkedIn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tom (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="padrao">✨ Padrão SOLLARIS</SelectItem>
                <SelectItem value="inspiracional">✨ Inspiracional</SelectItem>
                <SelectItem value="educativo">📚 Educativo</SelectItem>
                <SelectItem value="storytelling">📖 Storytelling</SelectItem>
                <SelectItem value="promocional-sutil">🎁 Promocional Sutil</SelectItem>
                <SelectItem value="bastidores">🎬 Bastidores</SelectItem>
                <SelectItem value="celebracao">🥂 Celebração</SelectItem>
              </SelectContent>
            </Select>
            <Select value={postStyle} onValueChange={(v: "dark" | "light" | "auto") => setPostStyle(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">🔄 Alternar Dark/Light</SelectItem>
                <SelectItem value="dark">🌑 Obsidiana (escuro)</SelectItem>
                <SelectItem value="light">🤍 Champagne (claro)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGenerate} disabled={loading || imageLoading} className="ml-auto">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Gerando...</> : <><Sparkles className="h-4 w-4 mr-1" />Gerar Post + Imagem</>}
            </Button>
          </div>

          {/* Brand assets indicator + toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowBrandAssets(!showBrandAssets)}>
                <BookOpen className="h-3.5 w-3.5" />
                Central de Marca
                {(brandAssets?.length || 0) > 0 && (
                  <Badge variant="secondary" className="text-[9px] ml-1">{brandAssets?.length} ativos</Badge>
                )}
              </Button>
              {(brandAssets?.length || 0) > 0 && (
                <span className="text-[10px] text-muted-foreground">✅ A IA está usando suas diretrizes de marca</span>
              )}
            </div>
          </div>

          {/* Quick ideas */}
          <div className="flex flex-wrap gap-1.5">
            {[
              "Lançamento de nova coleção",
              "Dica de presente para namorada",
              "Significado de uma pedra preciosa",
              "Bastidores da curadoria",
              "Depoimento de cliente",
              "Peça mais vendida do mês",
            ].map(idea => (
              <button
                key={idea}
                onClick={() => setPrompt(idea)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lightbulb className="h-2.5 w-2.5 inline mr-1" />{idea}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {(loading || imageLoading) && !generatedPost && (
        <Card>
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Criando post com a identidade SOLLARIS...</p>
            <p className="text-[10px] text-muted-foreground">Tom de voz editorial • Filosofia de curadoria • Estética premium</p>
          </CardContent>
        </Card>
      )}

      {/* Generated post */}
      {generatedPost && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Image + Caption side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Generated Image */}
            <Card className="border-accent/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImagePlus className="h-4 w-4 text-accent" />
                    Imagem do Post
                  </CardTitle>
                  <div className="flex gap-1.5">
                    {generatedImage && (
                      <Button size="sm" variant="outline" onClick={downloadImage}>
                        <Download className="h-3 w-3 mr-1" />Baixar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={handleRegenerateImage} disabled={imageLoading}>
                      {imageLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Sparkles className="h-3 w-3 mr-1" />Regerar</>}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {imageLoading && !generatedImage ? (
                  <div className="aspect-square rounded-lg bg-secondary/50 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <p className="text-xs text-muted-foreground">Gerando imagem com IA...</p>
                    <p className="text-[10px] text-muted-foreground">Identidade SOLLARIS • Cores da marca • Foto do produto</p>
                  </div>
                ) : generatedImage ? (
                  <div className="relative group">
                    <img
                      src={generatedImage}
                      alt="Post gerado"
                      className="w-full rounded-lg border border-accent/20"
                    />
                    {imageLoading && (
                      <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-secondary/50 flex flex-col items-center justify-center gap-2">
                    <Image className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Imagem não gerada</p>
                    <Button size="sm" variant="outline" onClick={handleRegenerateImage}>
                      <Sparkles className="h-3 w-3 mr-1" />Gerar Imagem
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Caption */}
            <Card className="border-accent/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>{platformEmoji[platform]}</span>
                    Post para {platform}
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={copyFullPost}>
                    <Copy className="h-3 w-3 mr-1" />Copiar Tudo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <div className="p-4 rounded-lg bg-secondary/50 whitespace-pre-wrap text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                    {generatedPost.caption}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedPost.caption)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background transition-colors"
                    title="Copiar legenda"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>

                {/* Hashtags */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Hashtags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedPost.hashtags.map((h, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[10px] cursor-pointer hover:bg-accent/20 transition-colors"
                        onClick={() => copyToClipboard(h.startsWith("#") ? h : `#${h}`)}
                      >
                        <Hash className="h-2.5 w-2.5 mr-0.5" />
                        {h.replace(/^#/, "")}
                      </Badge>
                    ))}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedPost.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" "))}
                    className="text-[10px] text-accent hover:underline mt-1.5"
                  >
                    Copiar todas as hashtags
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="h-4 w-4 text-accent" />
                  <p className="text-xs font-semibold">Sugestão Visual</p>
                </div>
                <p className="text-xs text-muted-foreground">{generatedPost.visual_suggestion}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <p className="text-xs font-semibold">Dicas da Plataforma</p>
                </div>
                <p className="text-xs text-muted-foreground">{generatedPost.platform_tips}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <p className="text-xs font-semibold">Melhor Horário</p>
                </div>
                <p className="text-xs text-muted-foreground">{generatedPost.best_time}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Histórico de Posts Gerados</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <Card key={i} className="hover:border-accent/20 transition-colors cursor-pointer" onClick={() => { if (h) { setGeneratedPost({ caption: h.caption, hashtags: h.hashtags, platform_tips: h.platform_tips, visual_suggestion: h.visual_suggestion, best_time: h.best_time }); setPlatform(h?.platform || "Instagram"); if (h.image) setGeneratedImage(h.image); } }}>
                <CardContent className="p-3 flex items-center gap-3">
                  {h?.image ? (
                    <img src={h.image} alt="" className="h-10 w-10 rounded-lg object-cover border border-accent/20" />
                  ) : (
                    <span className="text-lg">{platformEmoji[h?.platform || "Instagram"]}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{h?.prompt}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{h?.caption?.slice(0, 80)}...</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{h?.platform}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
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
          <TabsTrigger value="criar-post" className="text-xs gap-1.5"><Sparkles className="h-3.5 w-3.5" />Criar Post</TabsTrigger>
          <TabsTrigger value="email" className="text-xs gap-1.5"><Mail className="h-3.5 w-3.5" />E-mail</TabsTrigger>
          <TabsTrigger value="social" className="text-xs gap-1.5"><Instagram className="h-3.5 w-3.5" />Redes Sociais</TabsTrigger>
          <TabsTrigger value="ads" className="text-xs gap-1.5"><MousePointerClick className="h-3.5 w-3.5" />Anúncios</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Relatórios</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs gap-1.5"><TrendingUp className="h-3.5 w-3.5" />SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="criar-post"><CreatePostTab /></TabsContent>
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
