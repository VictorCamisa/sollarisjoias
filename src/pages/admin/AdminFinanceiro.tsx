import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminFinanceiro = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    type: "expense" as "income" | "expense",
    description: "",
    amount: "",
    due_date: "",
    paid_date: "",
    status: "pending",
    notes: "",
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["admin-financial-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createTransaction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financial_transactions").insert({
        type: form.type,
        description: form.description,
        amount: parseFloat(form.amount),
        due_date: form.due_date || null,
        paid_date: form.paid_date || null,
        status: form.status,
        notes: form.notes || null,
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
  const pending = transactions?.filter((t) => t.status === "pending").reduce((s, t) => s + Number(t.amount) * (t.type === "expense" ? -1 : 1), 0) ?? 0;
  const balance = totalIncome - totalExpense;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "outline" },
    paid: { label: "Pago", variant: "default" },
    overdue: { label: "Atrasado", variant: "destructive" },
    cancelled: { label: "Cancelado", variant: "secondary" },
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-serif font-semibold">Financeiro</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Financeiro</h1>
          <p className="text-xs text-muted-foreground mt-1">Controle de receitas e despesas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> Nova transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" placeholder="Ex: Compra de materiais" />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-xl" placeholder="0,00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Vencimento</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <Label>Data pagamento</Label>
                  <Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl" rows={2} />
              </div>
              <Button onClick={() => createTransaction.mutate()} disabled={!form.description || !form.amount} className="w-full rounded-xl">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receitas", value: totalIncome, icon: ArrowUpRight, color: "text-emerald-500" },
          { label: "Despesas", value: totalExpense, icon: ArrowDownRight, color: "text-red-500" },
          { label: "Saldo", value: balance, icon: DollarSign, color: balance >= 0 ? "text-emerald-500" : "text-red-500" },
          { label: "Pendente", value: pending, icon: pending >= 0 ? TrendingUp : TrendingDown, color: "text-amber-500" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className={`text-xl font-semibold ${card.color}`}>{fmt(card.value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar transação..." className="rounded-xl pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction list */}
      {!filtered?.length ? (
        <p className="text-sm text-muted-foreground text-center py-10">Nenhuma transação encontrada.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const st = statusLabels[t.status] || statusLabels.pending;
            return (
              <div key={t.id} className="border border-border rounded-xl p-4 bg-card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {t.type === "income" ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "Sem vencimento"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                  {t.status === "pending" && (
                    <Button size="sm" variant="outline" className="text-xs rounded-lg h-7"
                      onClick={() => updateStatus.mutate({ id: t.id, status: "paid", paid_date: new Date().toISOString().split("T")[0] })}>
                      Marcar pago
                    </Button>
                  )}
                  <span className={`text-sm font-semibold whitespace-nowrap ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                    {t.type === "income" ? "+" : "-"} {fmt(Number(t.amount))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminFinanceiro;
