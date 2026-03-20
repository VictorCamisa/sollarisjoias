import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users, Plus, Search, Filter, Trash2, Edit2, Phone, Mail, Tag,
  ChevronDown, UserPlus, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  novo:        { label: "Novo",        color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" },
  em_contato:  { label: "Em Contato",  color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  qualificado: { label: "Qualificado", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  convertido:  { label: "Convertido",  color: "bg-green-500/15 text-green-400 border-green-500/20" },
  descartado:  { label: "Descartado",  color: "bg-red-500/15 text-red-400 border-red-500/20" },
};

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", instagram: "Instagram", indicacao: "Indicação",
  site: "Site", loja: "Loja", manual: "Manual", outro: "Outro",
};

const INTEREST_LABELS: Record<string, string> = {
  anel: "Anel", colar: "Colar", brinco: "Brinco", pulseira: "Pulseira",
  alianca: "Aliança", relogio: "Relógio", conjunto: "Conjunto",
  personalizado: "Personalizado", outro: "Outro",
};

const AI_PROFILE_OPTIONS: Record<string, string> = {
  auto: "Automático (híbrido)",
  consultora: "Consultora de Joias",
  vendedora: "Vendedora Ativa",
  atendimento: "Atendimento Geral",
  pos_venda: "Pós-Venda & Fidelização",
};

const emptyForm = {
  name: "", phone: "", email: "", source: "manual", status: "novo",
  interest: "", budget: "", occasion: "", notes: "", ai_profile_override: "",
};

const AutomacoesLeads = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterInterest, setFilterInterest] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["sales-leads"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_leads").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload: any = {
        name: values.name,
        phone: values.phone || null,
        email: values.email || null,
        source: values.source,
        status: values.status,
        interest: values.interest || null,
        budget: values.budget ? Number(values.budget) : null,
        occasion: values.occasion || null,
        notes: values.notes || null,
        ai_profile_override: values.ai_profile_override || null,
      };
      if (editingId) {
        await (supabase.from as any)("sales_leads").update(payload).eq("id", editingId);
      } else {
        await (supabase.from as any)("sales_leads").insert(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      qc.invalidateQueries({ queryKey: ["sales-leads-overview"] });
      toast.success(editingId ? "Lead atualizado" : "Lead adicionado");
      setDialogOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
    },
    onError: () => toast.error("Erro ao salvar lead"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from as any)("sales_leads").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      toast.success("Lead removido");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await (supabase.from as any)("sales_leads").update({ status }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-leads"] }),
  });

  const openEdit = (lead: any) => {
    setEditingId(lead.id);
    setForm({
      name: lead.name, phone: lead.phone || "", email: lead.email || "",
      source: lead.source, status: lead.status, interest: lead.interest || "",
      budget: lead.budget ? String(lead.budget) : "", occasion: lead.occasion || "",
      notes: lead.notes || "", ai_profile_override: lead.ai_profile_override || "",
    });
    setDialogOpen(true);
  };

  const filtered = leads.filter((l: any) => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const matchSource = filterSource === "all" || l.source === filterSource;
    const matchInterest = filterInterest === "all" || l.interest === filterInterest;
    return matchSearch && matchStatus && matchSource && matchInterest;
  });

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Leads</h2>
            <p className="text-[11px] text-muted-foreground">{leads.length} prospects cadastrados</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setDialogOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar nome, telefone, e-mail..." className="pl-8 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterInterest} onValueChange={setFilterInterest}>
          <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Interesse" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(INTEREST_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = leads.filter((l: any) => l.status === key).length;
          return (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${filterStatus === key ? cfg.color : "border-border text-muted-foreground hover:border-accent/40"}`}>
              {cfg.label} <span className="font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserPlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum lead encontrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Adicione prospects ou ajuste os filtros</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contato</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Interesse</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Origem</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Adicionado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead: any, i: number) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[13px]">{lead.name}</div>
                    {lead.budget && <div className="text-[11px] text-muted-foreground">R$ {Number(lead.budget).toLocaleString("pt-BR")}</div>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {lead.phone && <div className="flex items-center gap-1 text-[12px] text-muted-foreground"><Phone className="h-3 w-3" />{lead.phone}</div>}
                      {lead.email && <div className="flex items-center gap-1 text-[12px] text-muted-foreground"><Mail className="h-3 w-3" />{lead.email}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {lead.interest ? (
                      <Badge variant="outline" className="text-[10px]">{INTEREST_LABELS[lead.interest] || lead.interest}</Badge>
                    ) : <span className="text-muted-foreground text-[12px]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[12px] text-muted-foreground">{SOURCE_LABELS[lead.source] || lead.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_CONFIG[lead.status]?.color}`}>
                          {STATUS_CONFIG[lead.status]?.label} <ChevronDown className="h-2.5 w-2.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36">
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <DropdownMenuItem key={k} onClick={() => statusMutation.mutate({ id: lead.id, status: k })}>
                            {v.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-[11px] text-muted-foreground">{format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR })}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Remover lead?")) deleteMutation.mutate(lead.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditingId(null); setForm({ ...emptyForm }); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs">Nome *</Label>
              <Input className="mt-1 h-8 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input className="mt-1 h-8 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input className="mt-1 h-8 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label className="text-xs">Origem</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Interesse</Label>
              <Select value={form.interest || "_none"} onValueChange={(v) => setForm({ ...form, interest: v === "_none" ? "" : v })}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Não informado</SelectItem>
                  {Object.entries(INTEREST_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Orçamento (R$)</Label>
              <Input className="mt-1 h-8 text-sm" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0,00" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Ocasião</Label>
              <Input className="mt-1 h-8 text-sm" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="Ex: casamento, presente, uso próprio..." />
            </div>
            <div>
              <Label className="text-xs">Perfil IA (Override)</Label>
              <Select value={form.ai_profile_override || "auto"} onValueChange={(v) => setForm({ ...form, ai_profile_override: v === "auto" ? "" : v })}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_PROFILE_OPTIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Observações</Label>
              <Textarea className="mt-1 text-sm resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informações adicionais sobre o lead..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={!form.name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Adicionar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomacoesLeads;
