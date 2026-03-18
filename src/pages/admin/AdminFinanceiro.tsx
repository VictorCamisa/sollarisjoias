import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, ArrowUpRight, ArrowDownRight, DollarSign, Wallet } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "default" },
  overdue: { label: "Atrasado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "secondary" },
};

const AdminFinanceiro = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    type: "expense" as "income" | "expense",
    description: "", amount: "", due_date: "", paid_date: "", status: "pending", notes: "",
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["admin-financial-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions").select("*").order("due_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createTransaction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financial_transactions").insert({
        type: form.type, description: form.description,
        amount: parseFloat(form.amount), due_date: form.due_date || null,
        paid_date: form.paid_date || null, status: form.status, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-financial-transactions"] });
      toast.success("Transação criada!");
      setDialogOpen(false);
      setForm({ type: "expense", description: "", amount: "", due_date: "", paid_date: "", status: "pending", notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, paid_date }: { id: string; status: string; paid_date?: string }) => {
      const update: any = { status };
      if (paid_date) update.paid_date = paid_date;
      const { error } = await supabase.from("financial_transactions").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-financial-transactions"] });
      toast.success("Atualizado!");
    },
  });

  const filtered = transactions?.filter((t) => {
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalIncome = transactions?.filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const totalExpense = transactions?.filter((t) => t.type === "expense" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const balance = totalIncome - totalExpense;
  const pendingAmount = transactions?.filter((t) => t.status === "pending").reduce((s, t) => s + Number(t.amount), 0) ?? 0;

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-semibold">Financeiro</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Controle de receitas e despesas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg gap-2 h-9 text-xs"><Plus className="h-3.5 w-3.5" /> Nova transação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Nova Transação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                    <SelectTrigger className="rounded-lg h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="rounded-lg h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg h-9 mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-lg h-9 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Vencimento</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="rounded-lg h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagamento</Label>
                  <Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} className="rounded-lg h-9 mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-lg mt-1" rows={2} />
              </div>
              <Button onClick={() => createTransaction.mutate()} disabled={!form.description || !form.amount} className="w-full rounded-lg h-9">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Receitas", value: totalIncome, icon: ArrowUpRight, color: "bg-emerald-500/10 text-emerald-500" },
          { label: "Despesas", value: totalExpense, icon: ArrowDownRight, color: "bg-red-500/10 text-red-500" },
          { label: "Saldo", value: balance, icon: DollarSign, color: balance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500" },
          { label: "Pendente", value: pendingAmount, icon: Wallet, color: "bg-amber-500/10 text-amber-500" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{card.label}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{fmtBRL(card.value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar transação..." className="rounded-lg pl-9 h-9 text-xs" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-28 rounded-lg h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-28 rounded-lg h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : !filtered?.length ? (
        <div className="text-center py-16">
          <DollarSign className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[auto_1fr_100px_100px_90px_90px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <span className="w-8">Tipo</span>
            <span>Descrição</span>
            <span>Vencimento</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Status</span>
            <span></span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((t, i) => {
              const st = statusLabels[t.status] || statusLabels.pending;
              return (
                <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_100px_100px_90px_90px] gap-3 items-center px-4 py-3 hover:bg-secondary/30 transition-colors">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {t.type === "income" ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{t.description}</p>
                    {t.notes && <p className="text-[10px] text-muted-foreground truncate">{t.notes}</p>}
                  </div>
                  <span className="hidden md:block text-[11px] text-muted-foreground">
                    {t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                  </span>
                  <span className={`hidden md:block text-[13px] font-semibold text-right tabular-nums ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                    {t.type === "income" ? "+" : "-"} {fmtBRL(Number(t.amount))}
                  </span>
                  <div className="hidden md:flex justify-center">
                    <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                  </div>
                  <div className="flex md:justify-center">
                    {t.status === "pending" && (
                      <Button size="sm" variant="outline" className="text-[10px] rounded-md h-6 px-2"
                        onClick={() => updateStatus.mutate({ id: t.id, status: "paid", paid_date: new Date().toISOString().split("T")[0] })}>
                        Pagar
                      </Button>
                    )}
                    {/* Mobile: show amount */}
                    <span className={`md:hidden text-xs font-semibold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}{fmtBRL(Number(t.amount))}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinanceiro;
