import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, AlertTriangle, TrendingUp, Wallet, Search, Phone,
  CheckCircle2, Clock, Shield, ShieldOff, Edit3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { KpiCard } from "@/components/admin/ui/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CrediarioCustomer {
  customer_id: string;
  full_name: string | null;
  phone: string | null;
  credit_limit: number;
  credit_score: number;
  credit_blocked: boolean;
  total_owed: number;
  total_overdue: number;
  open_installments: number;
  overdue_installments: number;
  next_due_date: string | null;
  last_payment_date: string | null;
}

interface Installment {
  id: string;
  order_id: string | null;
  description: string;
  amount: number;
  due_date: string | null;
  paid_date: string | null;
  status: string;
  installment_number: number | null;
  installments: number | null;
  customer_name: string | null;
  customer_phone: string | null;
}

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const scoreColor = (score: number) => {
  if (score >= 80) return "text-success bg-success/10 border-success/30";
  if (score >= 50) return "text-warning bg-warning/10 border-warning/30";
  return "text-destructive bg-destructive/10 border-destructive/30";
};

const scoreLabel = (score: number) => {
  if (score >= 80) return "Excelente";
  if (score >= 50) return "Regular";
  if (score >= 30) return "Baixo";
  return "Crítico";
};

const AdminCrediario = () => {
  const [customers, setCustomers] = useState<CrediarioCustomer[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CrediarioCustomer | null>(null);
  const [editLimit, setEditLimit] = useState("");
  const [editBlocked, setEditBlocked] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: cust }, { data: inst }] = await Promise.all([
      supabase
        .from("crediario_summary" as any)
        .select("*")
        .order("total_overdue", { ascending: false }),
      supabase
        .from("financial_transactions")
        .select("id, order_id, description, amount, due_date, paid_date, status, installment_number, installments, customer_name, customer_phone")
        .eq("sub_type", "crediario")
        .eq("status", "pending")
        .order("due_date", { ascending: true }),
    ]);
    setCustomers((cust as any) || []);
    setInstallments((inst as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const kpis = useMemo(() => {
    const totalReceber = customers.reduce((s, c) => s + Number(c.total_owed || 0), 0);
    const totalAtraso = customers.reduce((s, c) => s + Number(c.total_overdue || 0), 0);
    const clientesAtivos = customers.filter((c) => c.open_installments > 0).length;
    const ticketMedio = clientesAtivos > 0 ? totalReceber / clientesAtivos : 0;
    return { totalReceber, totalAtraso, clientesAtivos, ticketMedio };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const filteredInstallments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return installments;
    return installments.filter(
      (i) =>
        i.customer_name?.toLowerCase().includes(q) ||
        i.customer_phone?.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }, [installments, search]);

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("financial_transactions")
      .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao marcar como pago");
      return;
    }
    toast.success("Parcela quitada");
    loadAll();
  };

  const openEdit = (c: CrediarioCustomer) => {
    setEditing(c);
    setEditLimit(String(c.credit_limit || 0));
    setEditBlocked(c.credit_blocked);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        credit_limit: Number(editLimit) || 0,
        credit_blocked: editBlocked,
      })
      .eq("id", editing.customer_id);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Atualizado");
    setEditing(null);
    loadAll();
  };

  const sendWhatsApp = (phone: string | null, name: string | null, amount: number, due: string | null) => {
    if (!phone) return toast.error("Cliente sem telefone");
    const cleaned = phone.replace(/\D/g, "");
    const dueStr = due ? format(parseISO(due), "dd/MM/yyyy") : "—";
    const msg = encodeURIComponent(
      `Olá ${name || ""}! Lembrete da SOLLARIS: você tem uma parcela de ${fmtBRL(amount)} com vencimento em ${dueStr}. Qualquer dúvida estamos à disposição. ✨`
    );
    window.open(`https://wa.me/55${cleaned}?text=${msg}`, "_blank");
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <PageHeader
        hub="financas"
        title="Crediário"
        subtitle="Gestão de vendas a prazo, parcelas em aberto e análise de risco por cliente."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          hub="financas"
          icon={Wallet}
          label="Total a receber"
          value={kpis.totalReceber}
          format={fmtBRL}
        />
        <KpiCard
          hub="financas"
          icon={AlertTriangle}
          label="Em atraso"
          value={kpis.totalAtraso}
          format={fmtBRL}
        />
        <KpiCard
          hub="financas"
          icon={CreditCard}
          label="Clientes ativos"
          value={kpis.clientesAtivos}
        />
        <KpiCard
          hub="financas"
          icon={TrendingUp}
          label="Ticket médio"
          value={kpis.ticketMedio}
          format={fmtBRL}
        />
      </div>

      {/* Search */}
      <motion.div variants={staggerItem} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente, telefone..."
          className="admin-input pl-9"
        />
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="clientes" className="w-full">
        <TabsList>
          <TabsTrigger value="clientes">Clientes ({customers.length})</TabsTrigger>
          <TabsTrigger value="parcelas">Parcelas em aberto ({installments.length})</TabsTrigger>
        </TabsList>

        {/* CLIENTES */}
        <TabsContent value="clientes" className="mt-4">
          {loading ? (
            <div className="admin-empty">
              <div className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-3" />
              <p className="admin-empty-title">Carregando…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="admin-card p-12 text-center">
              <CreditCard className="admin-empty-icon" />
              <p className="admin-empty-title">Nenhum cliente com crediário</p>
              <p className="admin-empty-desc">
                Quando um cliente comprar a prazo, ele aparecerá aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="admin-card overflow-hidden">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th className="text-right">Devido</th>
                    <th className="text-right">Atraso</th>
                    <th className="text-center">Parcelas</th>
                    <th>Próx. venc.</th>
                    <th className="text-center">Score</th>
                    <th>Limite</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const daysLate = c.next_due_date
                      ? differenceInDays(new Date(), parseISO(c.next_due_date))
                      : 0;
                    return (
                      <tr key={c.customer_id}>
                        <td>
                          <div className="flex items-center gap-2">
                            {c.credit_blocked && (
                              <ShieldOff className="h-3.5 w-3.5 text-destructive" />
                            )}
                            <div>
                              <p className="font-medium text-foreground text-[13px]">
                                {c.full_name || "Sem nome"}
                              </p>
                              {c.phone && (
                                <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-right tabular-nums font-medium">
                          {fmtBRL(Number(c.total_owed || 0))}
                        </td>
                        <td className="text-right tabular-nums">
                          {Number(c.total_overdue) > 0 ? (
                            <span className="text-destructive font-semibold">
                              {fmtBRL(Number(c.total_overdue))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-center tabular-nums">
                          <span className="text-foreground">{c.open_installments}</span>
                          {c.overdue_installments > 0 && (
                            <span className="text-destructive ml-1">
                              ({c.overdue_installments} ⚠)
                            </span>
                          )}
                        </td>
                        <td className="text-[12px]">
                          {c.next_due_date ? (
                            <div>
                              <p className="text-foreground">
                                {format(parseISO(c.next_due_date), "dd/MM/yyyy")}
                              </p>
                              {daysLate > 0 && (
                                <p className="text-[10px] text-destructive">
                                  {daysLate}d atraso
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border tabular-nums",
                              scoreColor(c.credit_score)
                            )}
                          >
                            {c.credit_score} · {scoreLabel(c.credit_score)}
                          </span>
                        </td>
                        <td className="text-[12px] tabular-nums text-muted-foreground">
                          {fmtBRL(Number(c.credit_limit || 0))}
                        </td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(c)}
                            className="h-7 px-2 text-[11px]"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* PARCELAS */}
        <TabsContent value="parcelas" className="mt-4">
          {filteredInstallments.length === 0 ? (
            <div className="admin-card p-12 text-center">
              <CheckCircle2 className="admin-empty-icon" />
              <p className="admin-empty-title">Nenhuma parcela em aberto</p>
            </div>
          ) : (
            <div className="admin-card overflow-hidden">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vencimento</th>
                    <th>Cliente</th>
                    <th>Descrição</th>
                    <th className="text-center">Parcela</th>
                    <th className="text-right">Valor</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstallments.map((i) => {
                    const daysLate = i.due_date
                      ? differenceInDays(new Date(), parseISO(i.due_date))
                      : 0;
                    const isOverdue = daysLate > 0;
                    return (
                      <tr key={i.id}>
                        <td className="text-[12px]">
                          <div className="flex items-center gap-2">
                            {isOverdue ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <div>
                              <p className={cn("tabular-nums", isOverdue ? "text-destructive font-semibold" : "text-foreground")}>
                                {i.due_date ? format(parseISO(i.due_date), "dd/MM/yyyy") : "—"}
                              </p>
                              {isOverdue && (
                                <p className="text-[10px] text-destructive">{daysLate}d atraso</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-[13px] text-foreground">{i.customer_name || "—"}</p>
                          {i.customer_phone && (
                            <p className="text-[10px] text-muted-foreground">{i.customer_phone}</p>
                          )}
                        </td>
                        <td className="text-[12px] text-muted-foreground">{i.description}</td>
                        <td className="text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {i.installment_number}/{i.installments}
                          </Badge>
                        </td>
                        <td className="text-right tabular-nums font-medium">
                          {fmtBRL(Number(i.amount))}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {i.customer_phone && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => sendWhatsApp(i.customer_phone, i.customer_name, Number(i.amount), i.due_date)}
                                className="h-7 px-2 text-[11px]"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Cobrar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => markAsPaid(i.id)}
                              className="h-7 px-2 text-[11px]"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Quitar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              {editing?.full_name || "Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[11px] uppercase tracking-wider">Limite de crédito (R$)</Label>
              <Input
                type="number"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
                className="admin-input mt-1"
                placeholder="0,00"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border border-border">
              <div>
                <p className="text-[13px] font-medium">Bloquear novo crediário</p>
                <p className="text-[11px] text-muted-foreground">
                  Cliente não poderá comprar a prazo
                </p>
              </div>
              <button
                onClick={() => setEditBlocked(!editBlocked)}
                className={cn(
                  "h-6 w-11 rounded-full relative transition-colors",
                  editBlocked ? "bg-destructive" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-notion-sm transition-transform",
                    editBlocked ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
            {editing && (
              <div className="grid grid-cols-2 gap-2 text-[12px] pt-2 border-t border-border">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Score</p>
                  <p className="font-semibold tabular-nums">
                    {editing.credit_score} · {scoreLabel(editing.credit_score)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Devido</p>
                  <p className="font-semibold tabular-nums">{fmtBRL(Number(editing.total_owed))}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminCrediario;
