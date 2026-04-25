import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isSameMonth, addMonths, subMonths, isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, Phone,
  MapPin, Trash2, Edit2, CheckCircle, XCircle, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  consultoria: { label: "Consultoria",    color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" },
  ajuste:      { label: "Ajuste",         color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  personalizado:{ label: "Personalizado", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  retirada:    { label: "Retirada",       color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  agendado:        { label: "Agendado",         color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock },
  confirmado:      { label: "Confirmado",       color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle },
  concluido:       { label: "Concluído",        color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: CheckCircle },
  cancelado:       { label: "Cancelado",        color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
  nao_compareceu:  { label: "Não compareceu",   color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: XCircle },
};

const emptyForm = {
  client_name: "", client_phone: "", lead_id: "", title: "",
  type: "consultoria", status: "agendado", scheduled_at: "", scheduled_time: "10:00",
  duration_minutes: "60", location: "", notes: "",
};

const AutomacoesAgendamentos = () => {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailAppt, setDetailAppt] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["sales-appointments"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_appointments").select("*, sales_leads(name)").order("scheduled_at", { ascending: true });
      return data || [];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["sales-leads-slim"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_leads").select("id, name, phone").order("name");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const scheduled_at = `${form.scheduled_at}T${form.scheduled_time}:00`;
      await (supabase.from as any)("sales_appointments").insert({
        client_name: form.client_name,
        client_phone: form.client_phone || null,
        lead_id: form.lead_id || null,
        title: form.title,
        type: form.type,
        status: form.status,
        scheduled_at: new Date(scheduled_at).toISOString(),
        duration_minutes: Number(form.duration_minutes),
        location: form.location || null,
        notes: form.notes || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-appointments"] });
      toast.success("Agendamento criado");
      setDialogOpen(false);
      setForm({ ...emptyForm });
    },
    onError: () => toast.error("Erro ao criar agendamento"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await (supabase.from as any)("sales_appointments").update({ status }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-appointments"] });
      if (detailAppt) setDetailAppt((p: any) => ({ ...p, status: "" }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from as any)("sales_appointments").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-appointments"] });
      setDetailAppt(null);
      toast.success("Agendamento removido");
    },
  });

  const openCreate = (date?: Date) => {
    setForm({
      ...emptyForm,
      scheduled_at: date ? format(date, "yyyy-MM-dd") : "",
    });
    setDialogOpen(true);
  };

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = monthStart.getDay();

  const getAppsForDay = (day: Date) =>
    appointments.filter((a: any) => isSameDay(parseISO(a.scheduled_at), day));

  const upcoming = appointments.filter((a: any) => new Date(a.scheduled_at) >= new Date() && a.status !== "cancelado");
  const todayApps = appointments.filter((a: any) => isToday(parseISO(a.scheduled_at)));

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Agendamentos</h2>
            <p className="text-[11px] text-muted-foreground">
              {todayApps.length} hoje · {upcoming.length} próximos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-7">
              <TabsTrigger value="calendar" className="text-xs h-5 px-2">Calendário</TabsTrigger>
              <TabsTrigger value="list" className="text-xs h-5 px-2">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Agendar
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="border border-border rounded-xl overflow-hidden bg-card/30">
              {/* Month nav */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-secondary rounded transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-secondary rounded transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 border-b border-border">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} className="border-b border-r border-border/40 min-h-[72px]" />)}
                {days.map((day) => {
                  const dayApps = getAppsForDay(day);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`border-b border-r border-border/40 min-h-[72px] p-1.5 cursor-pointer transition-colors hover:bg-secondary/30 ${isSelected ? "bg-accent/5 border-accent/30" : ""} ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}`}
                    >
                      <div className={`text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? "bg-accent text-accent-foreground" : ""}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-0.5">
                        {dayApps.slice(0, 2).map((a: any) => (
                          <div key={a.id} className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${TYPE_CONFIG[a.type]?.color}`}>
                            {format(parseISO(a.scheduled_at), "HH:mm")} {a.client_name}
                          </div>
                        ))}
                        {dayApps.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayApps.length - 2}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected day events */}
            {selectedDay && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold capitalize">{format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openCreate(selectedDay)}>
                    <Plus className="h-3 w-3 mr-1" /> Agendar neste dia
                  </Button>
                </div>
                {getAppsForDay(selectedDay).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum agendamento neste dia</p>
                ) : (
                  <div className="space-y-2">
                    {getAppsForDay(selectedDay).map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => setDetailAppt(a)}>
                        <div className="flex items-center gap-2.5">
                          <div className="text-[12px] font-mono text-muted-foreground w-10">{format(parseISO(a.scheduled_at), "HH:mm")}</div>
                          <div>
                            <div className="text-[12px] font-medium">{a.client_name}</div>
                            <div className="text-[10px] text-muted-foreground">{a.title}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${TYPE_CONFIG[a.type]?.color}`}>{TYPE_CONFIG[a.type]?.label}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Upcoming sidebar */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Próximos</h3>
            <div className="space-y-2">
              {upcoming.slice(0, 8).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum agendamento próximo</p>
              ) : (
                upcoming.slice(0, 8).map((a: any) => (
                  <div key={a.id} onClick={() => setDetailAppt(a)} className="p-3 rounded-xl border border-border hover:border-accent/30 cursor-pointer transition-colors bg-card/30">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[12px] font-semibold">{a.client_name}</span>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${STATUS_CONFIG[a.status]?.color}`}>{STATUS_CONFIG[a.status]?.label}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">{a.title}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {format(parseISO(a.scheduled_at), "EEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // List view
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary/40 animate-pulse" />)
          ) : appointments.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum agendamento cadastrado</p>
            </div>
          ) : (
            appointments.map((a: any, i: number) => {
              const cfg = STATUS_CONFIG[a.status];
              const StatusIcon = cfg?.icon || Clock;
              return (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <div className="flex items-center gap-4 p-3.5 rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer bg-card/30 group" onClick={() => setDetailAppt(a)}>
                    {/* Date block */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className={`text-xs font-bold ${isToday(parseISO(a.scheduled_at)) ? "text-accent" : ""}`}>
                        {format(parseISO(a.scheduled_at), "dd")}
                      </div>
                      <div className="text-[10px] text-muted-foreground capitalize">{format(parseISO(a.scheduled_at), "MMM", { locale: ptBR })}</div>
                      <div className="text-[10px] text-muted-foreground">{format(parseISO(a.scheduled_at), "HH:mm")}</div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold text-foreground">{a.client_name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${TYPE_CONFIG[a.type]?.color}`}>{TYPE_CONFIG[a.type]?.label}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{a.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {a.client_phone && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Phone className="h-2.5 w-2.5" />{a.client_phone}</span>}
                        {a.location && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-2.5 w-2.5" />{a.location}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className={`flex-shrink-0 text-[10px] flex items-center gap-1 ${cfg?.color}`}>
                      <StatusIcon className="h-2.5 w-2.5" /> {cfg?.label}
                    </Badge>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setForm({ ...emptyForm }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs">Cliente *</Label>
              <div className="flex gap-2 mt-1">
                <Input className="h-8 text-sm flex-1" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Nome do cliente" />
                <Select value={form.lead_id || "_none"} onValueChange={(v) => {
                  const lead = leads.find((l: any) => l.id === v);
                  setForm({ ...form, lead_id: v === "_none" ? "" : v, client_name: lead?.name || form.client_name, client_phone: lead?.phone || form.client_phone });
                }}>
                  <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Do lead" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sem lead</SelectItem>
                    {leads.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input className="mt-1 h-8 text-sm" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Título / Serviço *</Label>
              <Input className="mt-1 h-8 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Escolha de aliança de noivado" />
            </div>
            <div>
              <Label className="text-xs">Data *</Label>
              <Input type="date" className="mt-1 h-8 text-xs" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Horário</Label>
              <Input type="time" className="mt-1 h-8 text-xs" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Duração (min)</Label>
              <Select value={form.duration_minutes} onValueChange={(v) => setForm({ ...form, duration_minutes: v })}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["30", "45", "60", "90", "120"].map((v) => <SelectItem key={v} value={v}>{v} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Local</Label>
              <Input className="mt-1 h-8 text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Loja / Online" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Observações</Label>
              <Textarea className="mt-1 text-sm resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.client_name.trim() || !form.title.trim() || !form.scheduled_at || saveMutation.isPending}>
              {saveMutation.isPending ? "Criando..." : "Criar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      {detailAppt && (
        <Dialog open={!!detailAppt} onOpenChange={() => setDetailAppt(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{detailAppt.client_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-[10px] ${TYPE_CONFIG[detailAppt.type]?.color}`}>{TYPE_CONFIG[detailAppt.type]?.label}</Badge>
                <Badge variant="outline" className={`text-[10px] ${STATUS_CONFIG[detailAppt.status]?.color}`}>{STATUS_CONFIG[detailAppt.status]?.label}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{detailAppt.title}</p>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  {format(parseISO(detailAppt.scheduled_at), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })} · {detailAppt.duration_minutes}min
                </div>
                {detailAppt.client_phone && <div className="flex items-center gap-2 text-muted-foreground text-xs"><Phone className="h-3.5 w-3.5" />{detailAppt.client_phone}</div>}
                {detailAppt.location && <div className="flex items-center gap-2 text-muted-foreground text-xs"><MapPin className="h-3.5 w-3.5" />{detailAppt.location}</div>}
                {detailAppt.notes && <p className="text-xs bg-secondary/30 rounded p-2">{detailAppt.notes}</p>}
              </div>

              {/* Change status */}
              <div>
                <Label className="text-xs text-muted-foreground">Atualizar status:</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <button key={k} onClick={() => updateStatusMutation.mutate({ id: detailAppt.id, status: k })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${detailAppt.status === k ? v.color : "border-border text-muted-foreground hover:border-accent/40"}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" size="sm" onClick={() => { if (confirm("Remover?")) deleteMutation.mutate(detailAppt.id); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDetailAppt(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AutomacoesAgendamentos;
