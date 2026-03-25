import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, ArrowUpRight, ArrowDownRight, DollarSign, Wallet,
  ShoppingCart, TrendingUp, Eye, Users, AlertTriangle, CheckCircle2, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { NewTransactionDialog, emptyTransactionForm, type TransactionForm } from "@/components/admin/financeiro/NewTransactionDialog";
import { TransactionDetailDrawer } from "@/components/admin/financeiro/TransactionDetailDrawer";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};
const statusLabels: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Atrasado", cancelled: "Cancelado" };

const AdminFinanceiro = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TransactionForm>(emptyTransactionForm);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["admin-financial-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_transactions")
        .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-financial-transactions"] });
      toast.success("Pago!");
    },
  });

  // Computed stats
  const stats = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0, balance: 0, pending: 0, overdue: 0, crediarioTotal: 0, crediarioPending: 0 };
    const income = transactions.filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter((t) => t.type === "expense" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0);
    const pending = transactions.filter((t) => t.status === "pending").reduce((s, t) => s + Number(t.amount), 0);
    const overdue = transactions.filter((t) => t.status === "overdue").reduce((s, t) => s + Number(t.amount), 0);
    const crediarioAll = transactions.filter((t) => (t as any).sub_type === "crediario" || (t as any).payment_method === "crediario");
    const crediarioTotal = crediarioAll.reduce((s, t) => s + Number(t.amount), 0);
    const crediarioPending = crediarioAll.filter((t) => t.status === "pending" || t.status === "overdue").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense, pending, overdue, crediarioTotal, crediarioPending };
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions?.filter((t) => {
      const s = search.toLowerCase();
      const matchSearch = !s || t.description.toLowerCase().includes(s) || ((t as any).customer_name || "").toLowerCase().includes(s);
      const matchType = filterType === "all" || t.type === filterType || (filterType === "crediario" && ((t as any).sub_type === "crediario" || (t as any).payment_method === "crediario"));
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [transactions, search, filterType, filterStatus]);

  // Crediário grouped by customer
  const crediarioByCustomer = useMemo(() => {
    if (!transactions) return [];
    const crediarioTxs = transactions.filter((t) => (t as any).sub_type === "crediario" || (t as any).payment_method === "crediario");
    const grouped: Record<string, { name: string; phone: string; total: number; pending: number; paid: number; transactions: any[] }> = {};
    crediarioTxs.forEach((t) => {
      const name = (t as any).customer_name || "Sem nome";
      if (!grouped[name]) grouped[name] = { name, phone: (t as any).customer_phone || "", total: 0, pending: 0, paid: 0, transactions: [] };
      grouped[name].total += Number(t.amount);
      if (t.status === "paid") grouped[name].paid += Number(t.amount);
      else grouped[name].pending += Number(t.amount);
      grouped[name].transactions.push(t);
    });
    return Object.values(grouped).sort((a, b) => b.pending - a.pending);
  }, [transactions]);

  const openNew = (type?: string) => {
    setForm({ ...emptyTransactionForm, type: type || "expense" });
    setDialogOpen(true);
  };

  const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        <div className={`${bg} ${color} p-1.5 rounded-lg`}><Icon className="h-3.5 w-3.5" /></div>
      </div>
      <span className="text-xl font-bold tabular-nums">{fmtBRL(value)}</span>
    </motion.div>
  );

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Financeiro</h1>
          <p className="admin-page-subtitle">Central de comando financeiro</p>
        </div>
        <Button size="sm" onClick={() => openNew()} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nova Transação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Receitas" value={stats.income} icon={ArrowUpRight} color="text-emerald-400" bg="bg-emerald-400/10" />
        <StatCard label="Despesas" value={stats.expense} icon={ArrowDownRight} color="text-red-400" bg="bg-red-400/10" />
        <StatCard label="Saldo" value={stats.balance} icon={DollarSign} color={stats.balance >= 0 ? "text-emerald-400" : "text-red-400"} bg={stats.balance >= 0 ? "bg-emerald-400/10" : "bg-red-400/10"} />
        <StatCard label="Pendente" value={stats.pending} icon={Wallet} color="text-amber-400" bg="bg-amber-400/10" />
        <StatCard label="Atrasado" value={stats.overdue} icon={AlertTriangle} color="text-red-400" bg="bg-red-400/10" />
        <StatCard label="Crediário" value={stats.crediarioPending} icon={Users} color="text-blue-400" bg="bg-blue-400/10" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/30 h-9">
          <TabsTrigger value="overview" className="text-xs gap-1.5">Transações</TabsTrigger>
          <TabsTrigger value="crediario" className="text-xs gap-1.5">
            Crediário
            {crediarioByCustomer.length > 0 && (
              <Badge className="ml-1 h-4 text-[9px] bg-blue-500/15 text-blue-400 border-0">{crediarioByCustomer.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: Transactions */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Receita", type: "income", icon: "💰" },
              { label: "Despesa", type: "expense", icon: "💸" },
              { label: "Compra", type: "purchase", icon: "🛒" },
              { label: "Investimento", type: "investment", icon: "📈" },
              { label: "Crediário", type: "crediario", icon: "📋" },
            ].map((q) => (
              <Button key={q.type} variant="outline" size="sm" className="text-xs gap-1.5 h-8" onClick={() => openNew(q.type)}>
                <span>{q.icon}</span> {q.label}
              </Button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar descrição ou cliente..." className="admin-input pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
                <SelectItem value="crediario">Crediário</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction list */}
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />)}</div>
          ) : !filtered?.length ? (
            <div className="text-center py-20">
              <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => openNew()}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Registrar transação
              </Button>
            </div>
          ) : (
            <div className="admin-card overflow-hidden">
              <div className="hidden md:grid grid-cols-[32px_minmax(0,1.5fr)_90px_110px_90px_80px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tipo</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Descrição</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Vencimento</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Valor</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Status</span>
                <span />
              </div>
              <div className="divide-y divide-border">
                {filtered.map((t, i) => {
                  const isIncome = t.type === "income";
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.015 }}
                      className="grid grid-cols-[32px_minmax(0,1fr)_auto] md:grid-cols-[32px_minmax(0,1.5fr)_90px_110px_90px_80px] gap-3 items-center px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTx(t)}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                        {isIncome ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{t.description}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {(t as any).customer_name && <span className="mr-1.5">👤 {(t as any).customer_name}</span>}
                          {(t as any).sub_type && <span className="capitalize">{(t as any).sub_type}</span>}
                        </p>
                      </div>
                      <span className="hidden md:block text-[11px] text-muted-foreground tabular-nums">
                        {t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                      </span>
                      <span className={`hidden md:block text-[13px] font-semibold text-right tabular-nums ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                        {isIncome ? "+" : "-"} {fmtBRL(Number(t.amount))}
                      </span>
                      <div className="hidden md:flex justify-center" onClick={(e) => e.stopPropagation()}>
                        {t.status === "pending" ? (
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 rounded-md"
                            onClick={() => markPaid.mutate(t.id)}>
                            Pagar
                          </Button>
                        ) : (
                          <Badge className={`text-[10px] border ${statusColors[t.status]}`}>{statusLabels[t.status]}</Badge>
                        )}
                      </div>
                      <div className="hidden md:flex justify-center">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB: Crediário */}
        <TabsContent value="crediario" className="mt-4 space-y-4">
          {crediarioByCustomer.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum crediário registrado.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => openNew("crediario")}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Registrar crediário
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {crediarioByCustomer.map((customer, i) => (
                <motion.div
                  key={customer.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="admin-card p-4 space-y-3"
                >
                  {/* Customer header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-lg">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{customer.name}</h3>
                        {customer.phone && <p className="text-[10px] text-muted-foreground">{customer.phone}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Pendente</p>
                      <p className={`text-lg font-bold tabular-nums ${customer.pending > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                        {fmtBRL(customer.pending)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Pago: {fmtBRL(customer.paid)}</span>
                      <span>Total: {fmtBRL(customer.total)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${customer.total > 0 ? (customer.paid / customer.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Installments */}
                  <div className="space-y-1">
                    {customer.transactions.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-secondary/30 transition-colors cursor-pointer text-xs"
                        onClick={() => setSelectedTx(t)}
                      >
                        <span className="text-muted-foreground truncate flex-1">{t.description}</span>
                        <span className="text-muted-foreground tabular-nums mx-2">
                          {t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                        </span>
                        <span className="font-medium tabular-nums w-24 text-right">{fmtBRL(Number(t.amount))}</span>
                        <div className="ml-2 w-16 flex justify-end" onClick={(e) => e.stopPropagation()}>
                          {t.status === "pending" ? (
                            <Button size="sm" variant="outline" className="text-[9px] h-5 px-1.5 rounded"
                              onClick={() => markPaid.mutate(t.id)}>
                              Pagar
                            </Button>
                          ) : (
                            <Badge className={`text-[9px] border ${statusColors[t.status]}`}>{statusLabels[t.status]}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* WhatsApp action */}
                  {customer.phone && customer.pending > 0 && (
                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 w-full"
                        onClick={() => {
                          const msg = `Olá ${customer.name}! Lembrete gentil sobre suas parcelas pendentes no valor de ${fmtBRL(customer.pending)}. Qualquer dúvida, estou à disposição! ✨`;
                          window.open(`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
                        }}
                      >
                        <Phone className="h-3 w-3" />
                        Enviar lembrete via WhatsApp
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewTransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} form={form} setForm={setForm} />
      <TransactionDetailDrawer transaction={selectedTx} open={!!selectedTx} onOpenChange={(v) => !v && setSelectedTx(null)} />
    </div>
  );
};

export default AdminFinanceiro;
