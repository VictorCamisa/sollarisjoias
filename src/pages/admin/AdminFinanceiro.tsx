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
  Package, CreditCard,
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

const typeLabels: Record<string, string> = {
  income: "💰 Receita", expense: "💸 Despesa", purchase: "🛒 Compra", investment: "📈 Investimento",
};

const AdminFinanceiro = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TransactionForm>(emptyTransactionForm);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("transacoes");

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
    if (!transactions) return { income: 0, expense: 0, balance: 0, pending: 0, overdue: 0, crediarioPending: 0, purchaseTotal: 0 };
    const income = transactions.filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter((t) => (t.type === "expense" || t.sub_type === "purchase" || t.sub_type === "investment") && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0);
    const pending = transactions.filter((t) => t.status === "pending").reduce((s, t) => s + Number(t.amount), 0);
    const overdue = transactions.filter((t) => t.status === "overdue").reduce((s, t) => s + Number(t.amount), 0);
    const crediarioAll = transactions.filter((t) => t.sub_type === "crediario" || t.payment_method === "crediario");
    const crediarioPending = crediarioAll.filter((t) => t.status === "pending" || t.status === "overdue").reduce((s, t) => s + Number(t.amount), 0);
    const purchaseTotal = transactions.filter((t) => t.sub_type === "purchase" || t.sub_type === "material" || t.sub_type === "produto" || t.sub_type === "equipamento" || (t.type === "expense" && (t.sub_type === "purchase" || t.description?.toLowerCase().includes("compra")))).reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense, pending, overdue, crediarioPending, purchaseTotal };
  }, [transactions]);

  // Filtered for Transações tab (non-crediário, non-purchase)
  const filteredTransacoes = useMemo(() => {
    return transactions?.filter((t) => {
      // Exclude crediário and purchase from this tab
      const isCrediario = t.sub_type === "crediario" || t.payment_method === "crediario";
      const isPurchase = t.sub_type === "purchase" || t.sub_type === "material" || t.sub_type === "produto" || t.sub_type === "equipamento";
      if (isCrediario || isPurchase) return false;

      const s = search.toLowerCase();
      const matchSearch = !s || t.description.toLowerCase().includes(s) || (t.customer_name || "").toLowerCase().includes(s);
      const matchType = filterType === "all" || t.type === filterType;
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [transactions, search, filterType, filterStatus]);

  // Purchases
  const purchases = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t) => {
      const isPurchase = t.sub_type === "purchase" || t.sub_type === "material" || t.sub_type === "produto" || t.sub_type === "equipamento";
      if (!isPurchase) return false;
      const s = search.toLowerCase();
      return !s || t.description.toLowerCase().includes(s);
    });
  }, [transactions, search]);

  // Crediário grouped by customer
  const crediarioByCustomer = useMemo(() => {
    if (!transactions) return [];
    const crediarioTxs = transactions.filter((t) => t.sub_type === "crediario" || t.payment_method === "crediario");
    const grouped: Record<string, { name: string; phone: string; total: number; pending: number; paid: number; totalInstallments: number; paidInstallments: number; transactions: any[] }> = {};
    crediarioTxs.forEach((t) => {
      const name = t.customer_name || "Sem nome";
      if (!grouped[name]) grouped[name] = { name, phone: t.customer_phone || "", total: 0, pending: 0, paid: 0, totalInstallments: 0, paidInstallments: 0, transactions: [] };
      grouped[name].total += Number(t.amount);
      grouped[name].totalInstallments += 1;
      if (t.status === "paid") {
        grouped[name].paid += Number(t.amount);
        grouped[name].paidInstallments += 1;
      } else {
        grouped[name].pending += Number(t.amount);
      }
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

  const TransactionRow = ({ t, i }: { t: any; i: number }) => {
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
            {t.customer_name && <span className="mr-1.5">👤 {t.customer_name}</span>}
            {t.sub_type && <span className="capitalize">{t.sub_type}</span>}
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
            <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 rounded-md" onClick={() => markPaid.mutate(t.id)}>Pagar</Button>
          ) : (
            <Badge className={`text-[10px] border ${statusColors[t.status]}`}>{statusLabels[t.status]}</Badge>
          )}
        </div>
        <div className="hidden md:flex justify-center">
          <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </motion.div>
    );
  };

  const TableHeader = () => (
    <div className="hidden md:grid grid-cols-[32px_minmax(0,1.5fr)_90px_110px_90px_80px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tipo</span>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Descrição</span>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Vencimento</span>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Valor</span>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Status</span>
      <span />
    </div>
  );

  const EmptyState = ({ icon: Icon, message, action, actionLabel }: any) => (
    <div className="text-center py-20">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {actionLabel}
        </Button>
      )}
    </div>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Receitas" value={stats.income} icon={ArrowUpRight} color="text-emerald-400" bg="bg-emerald-400/10" />
        <StatCard label="Despesas" value={stats.expense} icon={ArrowDownRight} color="text-red-400" bg="bg-red-400/10" />
        <StatCard label="Resultado" value={stats.balance} icon={DollarSign} color={stats.balance >= 0 ? "text-emerald-400" : "text-red-400"} bg={stats.balance >= 0 ? "bg-emerald-400/10" : "bg-red-400/10"} />
        <StatCard label="Pendente" value={stats.pending} icon={Wallet} color="text-amber-400" bg="bg-amber-400/10" />
        <StatCard label="Compras" value={stats.purchaseTotal} icon={ShoppingCart} color="text-violet-400" bg="bg-violet-400/10" />
        <StatCard label="Crediário" value={stats.crediarioPending} icon={Users} color="text-blue-400" bg="bg-blue-400/10" />
      </div>

      {/* Ações: lançar vs gerir */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="admin-card p-3 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Lançamentos rápidos</p>
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
        </div>

        <div className="admin-card p-3 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Gestão operacional</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="text-xs gap-1.5 h-8" onClick={() => setActiveTab("transacoes")}>
              <DollarSign className="h-3.5 w-3.5" />
              Gerir Transações
            </Button>
            <Button variant="secondary" size="sm" className="text-xs gap-1.5 h-8" onClick={() => setActiveTab("compras")}>
              <ShoppingCart className="h-3.5 w-3.5" />
              Gerir Compras
            </Button>
            <Button variant="secondary" size="sm" className="text-xs gap-1.5 h-8" onClick={() => setActiveTab("devedores")}>
              <Users className="h-3.5 w-3.5" />
              Gerir Devedores
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/30 h-9">
          <TabsTrigger value="transacoes" className="text-xs gap-1.5">
            <DollarSign className="h-3 w-3" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="compras" className="text-xs gap-1.5">
            <ShoppingCart className="h-3 w-3" />
            Compras
            {purchases.length > 0 && <Badge className="ml-1 h-4 text-[9px] bg-violet-500/15 text-violet-400 border-0">{purchases.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="devedores" className="text-xs gap-1.5">
            <Users className="h-3 w-3" />
            Devedores
            {crediarioByCustomer.filter(c => c.pending > 0).length > 0 && (
              <Badge className="ml-1 h-4 text-[9px] bg-red-500/15 text-red-400 border-0">
                {crediarioByCustomer.filter(c => c.pending > 0).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB: Transações (receitas, despesas, investimentos) ========== */}
        <TabsContent value="transacoes" className="mt-4 space-y-4">
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

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />)}</div>
          ) : !filteredTransacoes?.length ? (
            <EmptyState icon={DollarSign} message="Nenhuma transação encontrada." action={() => openNew("income")} actionLabel="Registrar receita" />
          ) : (
            <div className="admin-card overflow-hidden">
              <TableHeader />
              <div className="divide-y divide-border">
                {filteredTransacoes.map((t, i) => <TransactionRow key={t.id} t={t} i={i} />)}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========== TAB: Compras ========== */}
        <TabsContent value="compras" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar compra..." className="admin-input pl-9" />
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openNew("purchase")}>
              <Plus className="h-3.5 w-3.5" />
              Nova Compra
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />)}</div>
          ) : !purchases.length ? (
            <EmptyState icon={ShoppingCart} message="Nenhuma compra registrada. Registre compras de materiais, produtos para revenda e equipamentos." action={() => openNew("purchase")} actionLabel="Registrar compra" />
          ) : (
            <div className="space-y-3">
              {/* Purchase summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="admin-card p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Total compras</p>
                  <p className="text-lg font-bold tabular-nums text-violet-400">{fmtBRL(purchases.reduce((s, t) => s + Number(t.amount), 0))}</p>
                </div>
                <div className="admin-card p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Pagas</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-400">{purchases.filter(t => t.status === "paid").length}</p>
                </div>
                <div className="admin-card p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Pendentes</p>
                  <p className="text-lg font-bold tabular-nums text-amber-400">{purchases.filter(t => t.status === "pending").length}</p>
                </div>
              </div>

              <div className="admin-card overflow-hidden">
                <TableHeader />
                <div className="divide-y divide-border">
                  {purchases.map((t, i) => <TransactionRow key={t.id} t={t} i={i} />)}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========== TAB: Devedores ========== */}
        <TabsContent value="devedores" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {crediarioByCustomer.filter(c => c.pending > 0).length} pessoa(s) com débito pendente — Total: <span className="font-semibold text-amber-400">{fmtBRL(stats.crediarioPending)}</span>
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openNew("crediario")}>
              <Plus className="h-3.5 w-3.5" />
              Novo Crediário
            </Button>
          </div>

          {crediarioByCustomer.length === 0 ? (
            <EmptyState icon={Users} message="Nenhum crediário registrado." action={() => openNew("crediario")} actionLabel="Registrar crediário" />
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
                      <div className={`p-2.5 rounded-lg ${customer.pending > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{customer.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {customer.phone && <span>{customer.phone}</span>}
                          <span>•</span>
                          <span>{customer.paidInstallments}/{customer.totalInstallments} parcelas pagas</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {customer.pending > 0 ? (
                        <>
                          <p className="text-[10px] text-muted-foreground">Deve</p>
                          <p className="text-lg font-bold tabular-nums text-red-400">{fmtBRL(customer.pending)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] text-muted-foreground">Status</p>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">Quitado ✓</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Pago: {fmtBRL(customer.paid)}</span>
                      <span>Total: {fmtBRL(customer.total)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${customer.total > 0 ? (customer.paid / customer.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Installments list */}
                  <div className="space-y-1 bg-secondary/20 rounded-lg p-2">
                    {customer.transactions
                      .sort((a: any, b: any) => (a.installment_number || 0) - (b.installment_number || 0))
                      .map((t: any) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-secondary/40 transition-colors cursor-pointer text-xs"
                          onClick={() => setSelectedTx(t)}
                        >
                          <div className="flex items-center gap-2">
                            {t.status === "paid" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : t.status === "overdue" ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                            ) : (
                              <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-400" />
                            )}
                            <span className={`truncate ${t.status === "paid" ? "text-muted-foreground line-through" : ""}`}>
                              {t.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground tabular-nums">
                              {t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                            </span>
                            <span className="font-medium tabular-nums w-24 text-right">{fmtBRL(Number(t.amount))}</span>
                            <div className="w-14 flex justify-end" onClick={(e) => e.stopPropagation()}>
                              {t.status === "pending" || t.status === "overdue" ? (
                                <Button size="sm" variant="outline" className="text-[9px] h-5 px-1.5 rounded" onClick={() => markPaid.mutate(t.id)}>
                                  Pagar
                                </Button>
                              ) : (
                                <Badge className={`text-[9px] border ${statusColors[t.status]}`}>{statusLabels[t.status]}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* WhatsApp */}
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
