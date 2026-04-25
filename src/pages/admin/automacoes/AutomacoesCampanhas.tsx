import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Megaphone, Plus, Send, Pause, Trash2, Eye, MessageSquare,
  Mail, Play, CheckCircle, Clock, Users, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  rascunho:  { label: "Rascunho",  color: "bg-secondary text-muted-foreground border-border", icon: Clock },
  agendada:  { label: "Agendada",  color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock },
  ativa:     { label: "Ativa",     color: "bg-green-500/10 text-green-400 border-green-500/20", icon: Play },
  pausada:   { label: "Pausada",   color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Pause },
  concluida: { label: "Concluída", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: CheckCircle },
  cancelada: { label: "Cancelada", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: Trash2 },
};

const INTEREST_LABELS: Record<string, string> = {
  anel: "Anel", colar: "Colar", brinco: "Brinco", pulseira: "Pulseira",
  alianca: "Aliança", relogio: "Relógio", conjunto: "Conjunto",
  personalizado: "Personalizado", outro: "Outro",
};

const STATUS_LEAD_LABELS: Record<string, string> = {
  novo: "Novo", em_contato: "Em Contato", qualificado: "Qualificado",
  convertido: "Convertido", descartado: "Descartado",
};

const MESSAGE_TEMPLATES = [
  {
    label: "Nova Coleção",
    text: "Olá, {nome}! ✨\n\nUma nova coleção acaba de chegar à Sollaris — e ela foi feita pensando em você.\n\nPeças exclusivas em ouro 18k com pedras selecionadas a mão. Cada detalhe conta uma história.\n\n💎 Quer ver em primeira mão? Agende sua visita ou responda essa mensagem.\n\nSerá um prazer te receber!\n— Equipe Sollaris",
  },
  {
    label: "Dia das Mães",
    text: "{nome}, o Dia das Mães está chegando — e a maior declaração de amor pode caber numa caixinha. 💛\n\nSelecionamos as peças mais especiais para esse momento: colares, brincos e anéis em ouro 18k que ela vai usar para sempre.\n\n🎁 Embalagem premium + mensagem personalizada inclusa.\n\nGaranta antes que acabe — estoque limitado!\n— Sollaris 💎",
  },
  {
    label: "Dia dos Namorados",
    text: "{nome}, que presente você está planejando? 💍\n\nNa Sollaris, cada joia conta uma história de amor. De anéis clássicos a colares exclusivos — temos a peça certa para o seu momento especial.\n\n✨ Entrega garantida antes do Dia dos Namorados.\n\nMe conta: você prefere algo clássico, moderno ou personalizado?\n— Sollaris",
  },
  {
    label: "Natal & Fim de Ano",
    text: "{nome}, uma joia Sollaris é o presente que fica para sempre. 🌟\n\nColeção especial disponível com:\n✓ Embalagem premium de presente\n✓ Entrega expressa\n✓ Gravação personalizada em peças selecionadas\n\nNão deixe para a última hora — as favoritas esgotam rápido!\n— Equipe Sollaris 💎",
  },
  {
    label: "Aniversário do Cliente",
    text: "{nome}, feliz aniversário! 🎂\n\nNesse dia tão especial, a Sollaris quer celebrar com você. Preparamos uma surpresa — venha nos visitar e descubra o que temos para você.\n\nSó porque você merece brilhar ainda mais nessa data! ✨\n\nCom carinho,\n— Equipe Sollaris 💎",
  },
  {
    label: "Reativação",
    text: "{nome}, sentimos sua falta! 💛\n\nFaz um tempo que não nos encontramos. Enquanto isso, chegaram coisas incríveis na Sollaris — peças que tenho certeza que você vai adorar.\n\nQue tal uma visita? Tenho uma novidade guardada para você.\n\nEstamos esperando! 💎\n— Sollaris",
  },
  {
    label: "Pós-compra",
    text: "{nome}, esperamos que esteja apaixonada pela sua nova peça! 💕\n\nDica de cuidado: guarde em local seco e evite contato com perfume diretamente na joia — ela vai durar para sempre assim.\n\nQualquer dúvida sobre ajuste ou cuidados, estamos aqui.\n\nNos vemos em breve? 💎\n— Equipe Sollaris",
  },
  {
    label: "Promoção Relâmpago",
    text: "{nome}, avisa agora: condição especial na Sollaris! ⚡\n\nPor tempo limitado: peças selecionadas com preço especial. Estoque pequeno — vai rápido!\n\nNão perca a chance de garantir aquela peça que você estava de olho. 💎\n\n👉 Responda essa mensagem e te passo os detalhes agora.\n— Sollaris",
  },
];

const emptyForm = {
  name: "", description: "", channel: "whatsapp", message_template: "",
  segment_status: [] as string[], segment_interest: [] as string[], scheduled_at: "",
};

const AutomacoesCampanhas = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["sales-campaigns"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_campaigns").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: leadsCount } = useQuery({
    queryKey: ["sales-leads-count"],
    queryFn: async () => {
      const { count } = await (supabase.from as any)("sales_leads").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await (supabase.from as any)("sales_campaigns").insert({
        name: form.name,
        description: form.description || null,
        channel: form.channel,
        message_template: form.message_template || null,
        segment_status: form.segment_status,
        segment_interest: form.segment_interest,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        status: form.scheduled_at ? "agendada" : "rascunho",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-campaigns"] });
      toast.success("Campanha criada com sucesso");
      setDialogOpen(false);
      setForm({ ...emptyForm });
    },
    onError: () => toast.error("Erro ao criar campanha"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const extra: any = {};
      if (status === "ativa") extra.started_at = new Date().toISOString();
      if (status === "concluida") extra.completed_at = new Date().toISOString();
      await (supabase.from as any)("sales_campaigns").update({ status, ...extra }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-campaigns"] });
      if (detailCampaign) setDetailCampaign(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from as any)("sales_campaigns").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-campaigns"] });
      setDetailCampaign(null);
      toast.success("Campanha removida");
    },
  });

  const toggleSegmentStatus = (val: string) => {
    setForm((f) => ({
      ...f,
      segment_status: f.segment_status.includes(val) ? f.segment_status.filter((v) => v !== val) : [...f.segment_status, val],
    }));
  };

  const toggleSegmentInterest = (val: string) => {
    setForm((f) => ({
      ...f,
      segment_interest: f.segment_interest.includes(val) ? f.segment_interest.filter((v) => v !== val) : [...f.segment_interest, val],
    }));
  };

  const filtered = campaigns.filter((c: any) => filterStatus === "all" || c.status === filterStatus);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c: any) => c.status === "ativa").length,
    totalSent: campaigns.reduce((s: number, c: any) => s + (c.sent_count || 0), 0),
    totalReplied: campaigns.reduce((s: number, c: any) => s + (c.replied_count || 0), 0),
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Campanhas</h2>
            <p className="text-[11px] text-muted-foreground">{stats.total} campanhas · {stats.totalSent} mensagens enviadas</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total de Campanhas", value: stats.total, icon: Megaphone, color: "text-indigo-400" },
          { label: "Ativas Agora", value: stats.active, icon: Play, color: "text-green-400" },
          { label: "Mensagens Enviadas", value: stats.totalSent, icon: Send, color: "text-blue-400" },
          { label: "Respostas Recebidas", value: stats.totalReplied, icon: MessageSquare, color: "text-purple-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setFilterStatus("all")} className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${filterStatus === "all" ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground"}`}>
          Todas ({campaigns.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = campaigns.filter((c: any) => c.status === key).length;
          return (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${filterStatus === key ? cfg.color : "border-border text-muted-foreground"}`}>
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/40 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Crie sua primeira campanha de WhatsApp ou e-mail</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((campaign: any, i: number) => {
            const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.rascunho;
            const CfgIcon = cfg.icon;
            const replyRate = campaign.sent_count > 0 ? Math.round((campaign.replied_count / campaign.sent_count) * 100) : 0;
            return (
              <motion.div key={campaign.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent/30 transition-colors bg-card/30 group cursor-pointer" onClick={() => setDetailCampaign(campaign)}>
                  <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    {campaign.channel === "whatsapp" ? <MessageSquare className="h-4 w-4 text-green-400" /> : <Mail className="h-4 w-4 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold truncate text-foreground">{campaign.name}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${cfg.color}`}>
                        <CfgIcon className="h-2.5 w-2.5" /> {cfg.label}
                      </Badge>
                    </div>
                    {campaign.description && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{campaign.description}</p>}
                  </div>
                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-[13px] font-semibold text-foreground">{campaign.sent_count || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Enviados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[13px] font-semibold text-foreground">{campaign.replied_count || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Respostas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[13px] font-semibold text-accent">{replyRate}%</div>
                      <div className="text-[10px] text-muted-foreground">Taxa</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex-shrink-0 hidden lg:block">
                    {format(new Date(campaign.created_at), "dd/MM/yy", { locale: ptBR })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setForm({ ...emptyForm }); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Nome da campanha *</Label>
                <Input className="mt-1 h-8 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Lançamento Coleção Verão 2026" />
              </div>
              <div>
                <Label className="text-xs">Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                    <SelectItem value="email">📧 E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Agendamento (opcional)</Label>
                <Input type="datetime-local" className="mt-1 h-8 text-xs" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Descrição</Label>
              <Input className="mt-1 h-8 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição da campanha" />
            </div>

            {/* Message template */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Mensagem</Label>
                <div className="flex flex-wrap gap-1">
                  {MESSAGE_TEMPLATES.map((tpl) => (
                    <button key={tpl.label} onClick={() => setForm({ ...form, message_template: tpl.text })}
                      className="text-[10px] px-2 py-0.5 border border-border rounded text-muted-foreground hover:border-accent/40 transition-colors">
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea className="mt-1 text-sm resize-none" rows={4} value={form.message_template} onChange={(e) => setForm({ ...form, message_template: e.target.value })} placeholder="Use {nome} para personalizar com o nome do lead..." />
              <p className="text-[10px] text-muted-foreground mt-1">Use {"{nome}"} para personalizar a mensagem</p>
            </div>

            {/* Segmentation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Segmentar por Status</Label>
                <div className="space-y-1.5">
                  {Object.entries(STATUS_LEAD_LABELS).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <Checkbox checked={form.segment_status.includes(k)} onCheckedChange={() => toggleSegmentStatus(k)} id={`s-${k}`} />
                      <label htmlFor={`s-${k}`} className="text-xs cursor-pointer">{v}</label>
                    </div>
                  ))}
                </div>
                {form.segment_status.length === 0 && <p className="text-[10px] text-muted-foreground mt-1">Sem filtro = todos os leads</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Segmentar por Interesse</Label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {Object.entries(INTEREST_LABELS).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <Checkbox checked={form.segment_interest.includes(k)} onCheckedChange={() => toggleSegmentInterest(k)} id={`i-${k}`} />
                      <label htmlFor={`i-${k}`} className="text-xs cursor-pointer">{v}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                Alcance estimado: <strong className="text-foreground">{leadsCount} leads</strong> na base
                {(form.segment_status.length > 0 || form.segment_interest.length > 0) && " (com filtros aplicados, o número pode ser menor)"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? "Criando..." : "Criar Campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      {detailCampaign && (
        <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{detailCampaign.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${STATUS_CONFIG[detailCampaign.status]?.color}`}>
                  {STATUS_CONFIG[detailCampaign.status]?.label}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {detailCampaign.channel === "whatsapp" ? "💬 WhatsApp" : "📧 E-mail"}
                </Badge>
              </div>

              {detailCampaign.message_template && (
                <div className="bg-secondary/30 rounded-lg p-3 text-[12px] leading-relaxed">{detailCampaign.message_template}</div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Enviados", value: detailCampaign.sent_count || 0 },
                  { label: "Entregues", value: detailCampaign.delivered_count || 0 },
                  { label: "Lidos", value: detailCampaign.read_count || 0 },
                  { label: "Respostas", value: detailCampaign.replied_count || 0 },
                ].map((m) => (
                  <div key={m.label} className="bg-secondary/30 rounded-lg p-2">
                    <div className="text-base font-bold">{m.value}</div>
                    <div className="text-[10px] text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {detailCampaign.status === "rascunho" && (
                  <Button size="sm" className="flex-1" onClick={() => updateStatusMutation.mutate({ id: detailCampaign.id, status: "ativa" })}>
                    <Play className="h-3.5 w-3.5 mr-1.5" /> Ativar Campanha
                  </Button>
                )}
                {detailCampaign.status === "ativa" && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => updateStatusMutation.mutate({ id: detailCampaign.id, status: "pausada" })}>
                    <Pause className="h-3.5 w-3.5 mr-1.5" /> Pausar
                  </Button>
                )}
                {detailCampaign.status === "pausada" && (
                  <Button size="sm" className="flex-1" onClick={() => updateStatusMutation.mutate({ id: detailCampaign.id, status: "ativa" })}>
                    <Play className="h-3.5 w-3.5 mr-1.5" /> Retomar
                  </Button>
                )}
                {["ativa", "pausada"].includes(detailCampaign.status) && (
                  <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: detailCampaign.id, status: "concluida" })}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Concluir
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" size="sm" onClick={() => { if (confirm("Remover campanha?")) deleteMutation.mutate(detailCampaign.id); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remover
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDetailCampaign(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AutomacoesCampanhas;
