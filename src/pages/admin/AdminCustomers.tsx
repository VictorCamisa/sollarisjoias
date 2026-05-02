import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Search, Users, ArrowLeft, ShoppingBag, DollarSign, Calendar,
  KeyRound, Ban, CheckCircle, Save, TrendingUp, Phone, MessageCircle,
  Crown, AlertTriangle, Clock, Eye, Star, ArrowUpRight, ArrowDownRight,
  CreditCard, Target, Heart, Repeat, UserPlus, Filter, Package,
} from "lucide-react";
import { motion } from "framer-motion";

interface Profile {
  id: string; full_name: string | null; phone: string | null;
  address: string | null; notes: string | null; created_at: string; updated_at: string;
  cpf?: string | null; birthday?: string | null; email?: string | null;
}
interface Order {
  id: string; total: number; status: string; items: any; created_at: string;
  customer_name: string; customer_phone: string; customer_id: string | null;
}

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const fmtDateShort = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

type CustomerTier = "vip" | "regular" | "new" | "inactive" | "at_risk";

const tierConfig: Record<CustomerTier, { label: string; color: string; icon: any }> = {
  vip: { label: "VIP", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Crown },
  regular: { label: "Fiel", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Heart },
  new: { label: "Novo", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: UserPlus },
  inactive: { label: "Inativo", color: "bg-muted text-muted-foreground border-border", icon: Clock },
  at_risk: { label: "Em risco", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertTriangle },
};

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [sortBy, setSortBy] = useState("ltv");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const qc = useQueryClient();

  // ─── Data fetching ───
  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: allOrders } = useQuery({
    queryKey: ["admin-all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const { data: allDebts } = useQuery({
    queryKey: ["admin-all-debts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_transactions")
        .select("*")
        .or("sub_type.eq.crediario,payment_method.eq.crediario");
      if (error) throw error;
      return data;
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["admin-leads-for-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_leads").select("*");
      if (error) throw error;
      return data;
    },
  });

  // ─── Enriched customer data ───
  const enrichedCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.map((c) => {
      const orders = allOrders?.filter((o) => o.customer_id === c.id) || [];
      const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0);
      const orderCount = orders.length;
      const avgTicket = orderCount > 0 ? totalSpent / orderCount : 0;
      const lastOrderDate = orders[0]?.created_at || null;
      const daysSinceLastOrder = lastOrderDate ? daysSince(lastOrderDate) : 999;

      // Debt info
      const customerDebts = allDebts?.filter((d) =>
        d.customer_name?.toLowerCase() === c.full_name?.toLowerCase() ||
        d.customer_phone === c.phone
      ) || [];
      const totalDebt = customerDebts.filter((d) => d.status === "pending" || d.status === "overdue").reduce((s, d) => s + Number(d.amount), 0);
      const hasOverdueDebt = customerDebts.some((d) => d.status === "overdue");

      // Lead match
      const matchedLead = leads?.find((l) =>
        l.phone === c.phone || l.name?.toLowerCase() === c.full_name?.toLowerCase()
      );

      // Tier classification
      let tier: CustomerTier = "regular";
      if (orderCount === 0 && daysSince(c.created_at) < 30) tier = "new";
      else if (totalSpent >= 500 || orderCount >= 3) tier = "vip";
      else if (daysSinceLastOrder > 90 && orderCount > 0) tier = "at_risk";
      else if (daysSinceLastOrder > 180 || (orderCount === 0 && daysSince(c.created_at) > 60)) tier = "inactive";

      return {
        ...c,
        orders,
        totalSpent,
        orderCount,
        avgTicket,
        lastOrderDate,
        daysSinceLastOrder,
        totalDebt,
        hasOverdueDebt,
        customerDebts,
        matchedLead,
        tier,
      };
    });
  }, [customers, allOrders, allDebts, leads]);

  // ─── Global KPIs ───
  const kpis = useMemo(() => {
    const total = enrichedCustomers.length;
    const withOrders = enrichedCustomers.filter((c) => c.orderCount > 0);
    const totalRevenue = withOrders.reduce((s, c) => s + c.totalSpent, 0);
    const avgLTV = withOrders.length > 0 ? totalRevenue / withOrders.length : 0;
    const avgTicket = withOrders.length > 0 ? totalRevenue / withOrders.reduce((s, c) => s + c.orderCount, 0) : 0;
    const vips = enrichedCustomers.filter((c) => c.tier === "vip").length;
    const atRisk = enrichedCustomers.filter((c) => c.tier === "at_risk").length;
    const totalDebtPending = enrichedCustomers.reduce((s, c) => s + c.totalDebt, 0);
    const repeatRate = total > 0 ? (enrichedCustomers.filter((c) => c.orderCount > 1).length / total * 100) : 0;
    return { total, totalRevenue, avgLTV, avgTicket, vips, atRisk, totalDebtPending, repeatRate };
  }, [enrichedCustomers]);

  // ─── Filter & sort ───
  const filtered = useMemo(() => {
    let list = enrichedCustomers.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.full_name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
      const matchTier = filterTier === "all" || c.tier === filterTier;
      return matchSearch && matchTier;
    });
    list.sort((a, b) => {
      if (sortBy === "ltv") return b.totalSpent - a.totalSpent;
      if (sortBy === "orders") return b.orderCount - a.orderCount;
      if (sortBy === "recent") return (a.lastOrderDate && b.lastOrderDate) ? new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime() : a.lastOrderDate ? -1 : 1;
      if (sortBy === "debt") return b.totalDebt - a.totalDebt;
      if (sortBy === "name") return (a.full_name || "").localeCompare(b.full_name || "");
      return 0;
    });
    return list;
  }, [enrichedCustomers, search, filterTier, sortBy]);

  // ─── Selected customer ───
  const selected = enrichedCustomers.find((c) => c.id === selectedId);

  const selectCustomer = (c: any) => {
    setSelectedId(c.id);
    setEditName(c.full_name || "");
    setEditPhone(c.phone || "");
    setEditAddress(c.address || "");
    setEditNotes(c.notes || "");
    setEditCpf(c.cpf || "");
    setEditBirthday(c.birthday || "");
    setEditEmail(c.email || "");
  };

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles")
        .update({
          full_name: editName,
          phone: editPhone,
          address: editAddress,
          notes: editNotes,
          cpf: editCpf || null,
          birthday: editBirthday || null,
          email: editEmail || null,
        })
        .eq("id", selectedId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente atualizado!");
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  const manageUser = useMutation({
    mutationFn: async (params: { action: string; password?: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: params.action, userId: selectedId, password: params.password },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => { toast.success(data?.message || "Ação executada"); setNewPassword(""); },
    onError: (err: any) => toast.error(err.message),
  });

  // ─── Stat Card ───
  const StatCard = ({ label, value, icon: Icon, color, bg, sub }: any) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        <div className={`${bg} ${color} p-1.5 rounded-lg`}><Icon className="h-3.5 w-3.5" /></div>
      </div>
      <span className="text-xl font-bold tabular-nums">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </motion.div>
  );

  // ═══════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════
  if (selected) {
    const TierIcon = tierConfig[selected.tier].icon;
    return (
      <div className="max-w-[1400px] space-y-5">
        <button onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para lista
        </button>

        {/* Customer header */}
        <div className="admin-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center text-lg font-bold text-accent">
                {(selected.full_name || "?")[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{selected.full_name || "Sem nome"}</h1>
                  <Badge className={`text-[10px] border ${tierConfig[selected.tier].color}`}>
                    <TierIcon className="h-3 w-3 mr-1" />
                    {tierConfig[selected.tier].label}
                  </Badge>
                  {selected.hasOverdueDebt && (
                    <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">⚠ Devedor</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  <span>Cliente desde {fmtDate(selected.created_at)}</span>
                  {selected.phone && <span>· {selected.phone}</span>}
                  {selected.matchedLead && (
                    <Badge variant="outline" className="text-[9px]">Lead: {selected.matchedLead.status}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {selected.phone && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                  window.open(`https://wa.me/${selected.phone!.replace(/\D/g, "")}`, "_blank");
                }}>
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="LTV" value={fmtBRL(selected.totalSpent)} icon={DollarSign} color="text-emerald-400" bg="bg-emerald-400/10" />
          <StatCard label="Pedidos" value={selected.orderCount} icon={ShoppingBag} color="text-blue-400" bg="bg-blue-400/10" />
          <StatCard label="Ticket Médio" value={fmtBRL(selected.avgTicket)} icon={TrendingUp} color="text-accent" bg="bg-accent/10" />
          <StatCard label="Último Pedido" value={selected.lastOrderDate ? `${selected.daysSinceLastOrder}d atrás` : "—"} icon={Calendar} color="text-muted-foreground" bg="bg-secondary" sub={selected.lastOrderDate ? fmtDateShort(selected.lastOrderDate) : undefined} />
          <StatCard label="Débito Pendente" value={fmtBRL(selected.totalDebt)} icon={CreditCard} color={selected.totalDebt > 0 ? "text-red-400" : "text-emerald-400"} bg={selected.totalDebt > 0 ? "bg-red-400/10" : "bg-emerald-400/10"} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info">
          <TabsList className="bg-secondary/30 h-9">
            <TabsTrigger value="info" className="text-xs">Dados</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">
              Pedidos
              {selected.orderCount > 0 && <Badge className="ml-1.5 h-4 text-[9px] bg-blue-500/15 text-blue-400 border-0">{selected.orderCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="debts" className="text-xs">
              Débitos
              {selected.totalDebt > 0 && <Badge className="ml-1.5 h-4 text-[9px] bg-red-500/15 text-red-400 border-0">{selected.customerDebts.filter((d: any) => d.status !== "paid").length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs">Conta</TabsTrigger>
          </TabsList>

          {/* Tab: Info */}
          <TabsContent value="info" className="mt-4">
            <div className="admin-card p-5 space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="admin-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="admin-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">CPF</label>
                  <Input value={editCpf} onChange={(e) => setEditCpf(e.target.value)} placeholder="000.000.000-00" maxLength={14} className="admin-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Aniversário</label>
                  <Input type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} className="admin-input" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">E-mail</label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="cliente@email.com" className="admin-input" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Endereço</label>
                <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="admin-input" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Notas internas</label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="admin-input min-h-[60px] resize-none" />
              </div>
              <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} size="sm" className="gap-1.5 text-xs">
                <Save className="h-3.5 w-3.5" /> Salvar alterações
              </Button>
            </div>
          </TabsContent>

          {/* Tab: Orders */}
          <TabsContent value="orders" className="mt-4 space-y-3">
            {selected.orders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum pedido vinculado.</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs gap-1.5" onClick={() => navigate("/admin/pedidos")}>
                  <ArrowUpRight className="h-3 w-3" /> Ir para Pedidos
                </Button>
              </div>
            ) : (
              <div className="admin-card overflow-hidden">
                <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_100px_80px_100px_80px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Itens</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Data</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase text-center">Status</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase text-right">Valor</span>
                  <span />
                </div>
                <div className="divide-y divide-border">
                  {selected.orders.map((o: any, i: number) => (
                    <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.5fr)_100px_80px_100px_80px] gap-3 items-center px-4 py-3 hover:bg-secondary/20 cursor-pointer"
                      onClick={() => navigate("/admin/pedidos")}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">
                          {Array.isArray(o.items) ? (o.items as any[]).map((it: any) => it.name).join(", ") : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {Array.isArray(o.items) ? `${(o.items as any[]).length} item(ns)` : ""}
                        </p>
                      </div>
                      <span className="hidden md:block text-[11px] text-muted-foreground tabular-nums">{fmtDateShort(o.created_at)}</span>
                      <div className="hidden md:flex justify-center">
                        <Badge variant="outline" className="text-[10px] capitalize">{o.status}</Badge>
                      </div>
                      <span className="hidden md:block text-[13px] font-semibold text-right tabular-nums text-foreground">{fmtBRL(Number(o.total))}</span>
                      <div className="hidden md:flex justify-center">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab: Debts */}
          <TabsContent value="debts" className="mt-4 space-y-3">
            {selected.customerDebts.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum débito registrado.</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs gap-1.5" onClick={() => navigate("/admin/financeiro")}>
                  <ArrowUpRight className="h-3 w-3" /> Ir para Financeiro
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="admin-card p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Total devido</p>
                    <p className="text-lg font-bold tabular-nums text-accent">{fmtBRL(selected.customerDebts.reduce((s: number, d: any) => s + Number(d.amount), 0))}</p>
                  </div>
                  <div className="admin-card p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Pendente</p>
                    <p className="text-lg font-bold tabular-nums text-red-400">{fmtBRL(selected.totalDebt)}</p>
                  </div>
                  <div className="admin-card p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Pago</p>
                    <p className="text-lg font-bold tabular-nums text-emerald-400">
                      {fmtBRL(selected.customerDebts.filter((d: any) => d.status === "paid").reduce((s: number, d: any) => s + Number(d.amount), 0))}
                    </p>
                  </div>
                </div>
                <div className="admin-card overflow-hidden divide-y divide-border">
                  {selected.customerDebts
                    .sort((a: any, b: any) => (a.installment_number || 0) - (b.installment_number || 0))
                    .map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-2">
                          {d.status === "paid" ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          ) : d.status === "overdue" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                          )}
                          <div>
                            <p className={`text-[13px] font-medium ${d.status === "paid" ? "line-through text-muted-foreground" : "text-foreground"}`}>{d.description}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Venc: {d.due_date ? fmtDate(d.due_date + "T12:00:00") : "—"}
                              {d.installments > 1 && ` · Parcela ${d.installment_number}/${d.installments}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-semibold tabular-nums text-foreground">{fmtBRL(Number(d.amount))}</span>
                          <Badge className={`text-[9px] border ${
                            d.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            d.status === "overdue" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {d.status === "paid" ? "Pago" : d.status === "overdue" ? "Atrasado" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
                {selected.totalDebt > 0 && selected.phone && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full" onClick={() => {
                    const msg = `Olá ${selected.full_name}! Lembrete gentil sobre suas parcelas pendentes no valor de ${fmtBRL(selected.totalDebt)}. Qualquer dúvida, estou à disposição! ✨`;
                    window.open(`https://wa.me/${selected.phone!.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
                  }}>
                    <Phone className="h-3.5 w-3.5" /> Enviar lembrete via WhatsApp
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab: Account */}
          <TabsContent value="account" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
              <div className="admin-card p-4 space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3" /> Resetar senha
                </h3>
                <Input type="password" placeholder="Nova senha (mín. 6)" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} className="admin-input" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-[10px] h-7"
                    disabled={newPassword.length < 6 || manageUser.isPending}
                    onClick={() => manageUser.mutate({ action: "reset_password", password: newPassword })}>
                    Definir senha
                  </Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-7"
                    disabled={manageUser.isPending}
                    onClick={() => manageUser.mutate({ action: "reset_password" })}>
                    Enviar email
                  </Button>
                </div>
              </div>
              <div className="admin-card p-4 space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Ban className="h-3 w-3" /> Gerenciar acesso
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="text-[10px] h-7"
                    disabled={manageUser.isPending} onClick={() => manageUser.mutate({ action: "disable" })}>
                    <Ban className="h-3 w-3 mr-1" /> Desativar
                  </Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-7"
                    disabled={manageUser.isPending} onClick={() => manageUser.mutate({ action: "enable" })}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Reativar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // LIST VIEW — WAR ROOM
  // ═══════════════════════════════════════════
  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="admin-page-title">Sala de Guerra — Clientes</h1>
        <p className="admin-page-subtitle">Inteligência comercial e gestão de relacionamento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total" value={kpis.total} icon={Users} color="text-foreground" bg="bg-secondary" />
        <StatCard label="Receita Total" value={fmtBRL(kpis.totalRevenue)} icon={DollarSign} color="text-emerald-400" bg="bg-emerald-400/10" />
        <StatCard label="LTV Médio" value={fmtBRL(kpis.avgLTV)} icon={TrendingUp} color="text-accent" bg="bg-accent/10" />
        <StatCard label="Ticket Médio" value={fmtBRL(kpis.avgTicket)} icon={Target} color="text-blue-400" bg="bg-blue-400/10" />
        <StatCard label="VIPs" value={kpis.vips} icon={Crown} color="text-amber-400" bg="bg-amber-400/10" />
        <StatCard label="Em Risco" value={kpis.atRisk} icon={AlertTriangle} color="text-red-400" bg="bg-red-400/10" />
        <StatCard label="Recompra" value={`${kpis.repeatRate.toFixed(0)}%`} icon={Repeat} color="text-violet-400" bg="bg-violet-400/10" />
        <StatCard label="Débitos" value={fmtBRL(kpis.totalDebtPending)} icon={CreditCard} color={kpis.totalDebtPending > 0 ? "text-red-400" : "text-emerald-400"} bg={kpis.totalDebtPending > 0 ? "bg-red-400/10" : "bg-emerald-400/10"} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="admin-input pl-9" />
        </div>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Segmento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="vip">👑 VIP</SelectItem>
            <SelectItem value="regular">💚 Fiel</SelectItem>
            <SelectItem value="new">🆕 Novo</SelectItem>
            <SelectItem value="at_risk">⚠️ Em risco</SelectItem>
            <SelectItem value="inactive">💤 Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ltv">Maior LTV</SelectItem>
            <SelectItem value="orders">Mais pedidos</SelectItem>
            <SelectItem value="recent">Compra recente</SelectItem>
            <SelectItem value="debt">Maior débito</SelectItem>
            <SelectItem value="name">Nome A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer list */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[44px_minmax(0,1.5fr)_80px_100px_100px_80px_80px_60px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
            <span />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cliente</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Segmento</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">LTV</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Débito</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Pedidos</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Último</span>
            <span />
          </div>
          <div className="divide-y divide-border">
            {filtered.map((c, i) => {
              const TierIcon = tierConfig[c.tier].icon;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.012 }}
                  className="grid grid-cols-[44px_minmax(0,1fr)_auto] md:grid-cols-[44px_minmax(0,1.5fr)_80px_100px_100px_80px_80px_60px] gap-3 items-center px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/admin/clientes/${c.id}`)}
                >
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                    {(c.full_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium truncate">{c.full_name || "Sem nome"}</p>
                      {c.hasOverdueDebt && <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {c.phone || "Sem telefone"}
                      {c.matchedLead && <span className="ml-1.5">· Lead {c.matchedLead.status}</span>}
                    </p>
                  </div>
                  <div className="hidden md:flex justify-center">
                    <Badge className={`text-[9px] border ${tierConfig[c.tier].color}`}>
                      <TierIcon className="h-2.5 w-2.5 mr-0.5" />
                      {tierConfig[c.tier].label}
                    </Badge>
                  </div>
                  <span className="hidden md:block text-[13px] font-semibold text-right tabular-nums text-emerald-400">
                    {fmtBRL(c.totalSpent)}
                  </span>
                  <span className={`hidden md:block text-[13px] font-semibold text-right tabular-nums ${c.totalDebt > 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {c.totalDebt > 0 ? fmtBRL(c.totalDebt) : "—"}
                  </span>
                  <span className="hidden md:block text-[12px] text-center tabular-nums">{c.orderCount}</span>
                  <span className="hidden md:block text-[11px] text-center text-muted-foreground tabular-nums">
                    {c.lastOrderDate ? `${c.daysSinceLastOrder}d` : "—"}
                  </span>
                  <div className="hidden md:flex justify-center">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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

export default AdminCustomers;
