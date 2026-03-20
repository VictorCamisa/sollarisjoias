import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Kanban, Plus, X, Phone, DollarSign, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STAGES = [
  { key: "novo",        label: "Novo Lead",       color: "#6366f1", bg: "bg-indigo-500/10" },
  { key: "em_contato",  label: "Em Contato",      color: "#3b82f6", bg: "bg-blue-500/10" },
  { key: "consultoria", label: "Consultoria",     color: "#8b5cf6", bg: "bg-purple-500/10" },
  { key: "orcamento",   label: "Orçamento",       color: "#f59e0b", bg: "bg-amber-500/10" },
  { key: "proposta",    label: "Proposta",        color: "#f97316", bg: "bg-orange-500/10" },
  { key: "ganho",       label: "Ganho 🏆",        color: "#10b981", bg: "bg-emerald-500/10" },
  { key: "perdido",     label: "Perdido",         color: "#ef4444", bg: "bg-red-500/10" },
];

const INTEREST_LABELS: Record<string, string> = {
  anel: "Anel", colar: "Colar", brinco: "Brinco", pulseira: "Pulseira",
  alianca: "Aliança", relogio: "Relógio", conjunto: "Conjunto",
  personalizado: "Personalizado", outro: "Outro",
};

const AutomacoesPipeline = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpp, setDetailOpp] = useState<any>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [form, setForm] = useState({ lead_id: "", stage_key: "novo", value: "", notes: "" });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["sales-pipeline"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_opportunities")
        .select("*, sales_leads(id, name, phone, interest, budget)")
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["sales-leads-slim"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_leads").select("id, name, phone, interest").order("name");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await (supabase.from as any)("sales_opportunities").insert({
        lead_id: form.lead_id,
        stage_key: form.stage_key,
        value: form.value ? Number(form.value) : null,
        notes: form.notes || null,
        stage_entered_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-pipeline"] });
      toast.success("Oportunidade adicionada ao pipeline");
      setDialogOpen(false);
      setForm({ lead_id: "", stage_key: "novo", value: "", notes: "" });
    },
    onError: () => toast.error("Erro ao adicionar oportunidade"),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, stage_key }: { id: string; stage_key: string }) => {
      await (supabase.from as any)("sales_opportunities").update({ stage_key, stage_entered_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-pipeline"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("sales_opportunities").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-pipeline"] });
      setDetailOpp(null);
      toast.success("Oportunidade removida");
    },
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (draggedId) {
      moveMutation.mutate({ id: draggedId, stage_key: stageKey });
      setDraggedId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const totalValue = opportunities.reduce((s: number, o: any) => s + (o.value || 0), 0);
  const ganhoValue = opportunities.filter((o: any) => o.stage_key === "ganho").reduce((s: number, o: any) => s + (o.value || 0), 0);

  return (
    <div className="space-y-4 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Kanban className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Pipeline de Vendas</h2>
            <p className="text-[11px] text-muted-foreground">
              {opportunities.length} oportunidades · R$ {totalValue.toLocaleString("pt-BR")} em pipeline · R$ {ganhoValue.toLocaleString("pt-BR")} ganho
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Oportunidade
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        {STAGES.map((stage) => {
          const cards = opportunities.filter((o: any) => o.stage_key === stage.key);
          const stageValue = cards.reduce((s: number, o: any) => s + (o.value || 0), 0);
          return (
            <div
              key={stage.key}
              className="flex-shrink-0 w-[220px] flex flex-col gap-2"
              onDrop={(e) => handleDrop(e, stage.key)}
              onDragOver={handleDragOver}
            >
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${stage.bg}`}>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-[11px] font-semibold">{stage.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium">{cards.length}</span>
                  {stageValue > 0 && (
                    <span className="text-[10px] text-muted-foreground">· R${(stageValue / 1000).toFixed(0)}k</span>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 min-h-[120px]">
                {cards.map((opp: any) => {
                  const daysInStage = differenceInDays(new Date(), new Date(opp.stage_entered_at || opp.created_at));
                  return (
                    <motion.div
                      key={opp.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, opp.id)}
                      onClick={() => setDetailOpp(opp)}
                      className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-accent/40 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[12px] font-semibold leading-tight">{opp.sales_leads?.name || "—"}</span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); if (confirm("Remover?")) deleteMutation.mutate(opp.id); }}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {opp.sales_leads?.interest && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{INTEREST_LABELS[opp.sales_leads.interest] || opp.sales_leads.interest}</Badge>
                        )}
                        {opp.value && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <DollarSign className="h-3 w-3" />R$ {Number(opp.value).toLocaleString("pt-BR")}
                          </div>
                        )}
                        {opp.sales_leads?.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Phone className="h-3 w-3" />{opp.sales_leads.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />{daysInStage === 0 ? "Hoje" : `${daysInStage}d nesta etapa`}
                        </div>
                      </div>

                      {/* Mover para próxima etapa */}
                      {stage.key !== "ganho" && stage.key !== "perdido" && (() => {
                        const nextIdx = STAGES.findIndex((s) => s.key === stage.key) + 1;
                        const next = STAGES[nextIdx];
                        return next ? (
                          <button
                            className="mt-2 flex items-center gap-1 text-[10px] text-accent hover:underline"
                            onClick={(e) => { e.stopPropagation(); moveMutation.mutate({ id: opp.id, stage_key: next.key }); }}
                          >
                            <ChevronRight className="h-3 w-3" /> {next.label}
                          </button>
                        ) : null;
                      })()}
                    </motion.div>
                  );
                })}

                {/* Drop zone indicator */}
                {draggedId && (
                  <div className="border-2 border-dashed border-accent/30 rounded-lg h-16 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">Soltar aqui</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add opportunity dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Lead *</Label>
              <Select value={form.lead_id} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} {l.phone ? `· ${l.phone}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Etapa inicial</Label>
              <Select value={form.stage_key} onValueChange={(v) => setForm({ ...form, stage_key: v })}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.filter((s) => s.key !== "ganho" && s.key !== "perdido").map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor estimado (R$)</Label>
              <Input className="mt-1 h-8 text-sm" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea className="mt-1 text-sm resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!form.lead_id || addMutation.isPending}>
              {addMutation.isPending ? "Adicionando..." : "Adicionar ao Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      {detailOpp && (
        <Dialog open={!!detailOpp} onOpenChange={() => setDetailOpp(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{detailOpp.sales_leads?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm py-2">
              {detailOpp.sales_leads?.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{detailOpp.sales_leads.phone}</div>}
              {detailOpp.value && <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-3.5 w-3.5" />R$ {Number(detailOpp.value).toLocaleString("pt-BR")}</div>}
              {detailOpp.notes && <p className="text-muted-foreground text-xs bg-secondary/30 rounded p-2">{detailOpp.notes}</p>}
              <div className="pt-2">
                <Label className="text-xs">Mover para etapa</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {STAGES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => { moveMutation.mutate({ id: detailOpp.id, stage_key: s.key }); setDetailOpp({ ...detailOpp, stage_key: s.key }); }}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${detailOpp.stage_key === s.key ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground hover:border-accent/40"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(detailOpp.id)}>Remover</Button>
              <Button variant="outline" size="sm" onClick={() => setDetailOpp(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AutomacoesPipeline;
