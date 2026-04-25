import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Truck, Phone, Mail, Trash2, Edit2, Star, MapPin,
  Globe, Tag, ArrowLeft, Eye, MessageCircle, FileText, ShoppingCart,
  CheckCircle, Clock, AlertTriangle, X, DollarSign, Package, BarChart3,
  ArrowUpDown, Scale, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const categoryOptions = [
  { value: "geral", label: "Geral" },
  { value: "semijoias", label: "Semijoias" },
  { value: "banho", label: "Banho/Galvanoplastia" },
  { value: "pedras", label: "Pedras" },
  { value: "embalagem", label: "Embalagem" },
  { value: "materia_prima", label: "Matéria-prima" },
  { value: "ferramentas", label: "Ferramentas" },
  { value: "logistica", label: "Logística/Frete" },
  { value: "marketing", label: "Marketing" },
  { value: "tecnologia", label: "Tecnologia" },
];

const stateOptions = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const quotationStatusColors: Record<string, string> = {
  pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  respondida: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  aprovada: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejeitada: "bg-red-500/10 text-red-400 border-red-500/20",
  expirada: "bg-muted text-muted-foreground border-border",
};

interface SupplierForm {
  name: string; contact_name: string; phone: string; email: string;
  notes: string; category: string; website: string; city: string;
  state: string; tags: string; status: string;
}

const emptyForm: SupplierForm = {
  name: "", contact_name: "", phone: "", email: "", notes: "",
  category: "geral", website: "", city: "", state: "", tags: "", status: "ativo",
};

interface QuotationForm {
  title: string; notes: string; total: string; valid_until: string;
  supplier_id: string; supplier_name_external: string; category: string;
  items: { description: string; qty: string; unit_price: string }[];
}

const emptyQuotation: QuotationForm = {
  title: "", notes: "", total: "", valid_until: "",
  supplier_id: "", supplier_name_external: "", category: "geral",
  items: [{ description: "", qty: "1", unit_price: "" }],
};

const AdminFornecedores = () => {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState("fornecedores");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quotationForm, setQuotationForm] = useState<QuotationForm>(emptyQuotation);
  const [activeTab, setActiveTab] = useState("info");
  // Quotation tab filters
  const [qSearch, setQSearch] = useState("");
  const [qFilterStatus, setQFilterStatus] = useState("all");
  const [qFilterCategory, setQFilterCategory] = useState("all");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // ─── Data ───
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: quotations } = useQuery({
    queryKey: ["admin-supplier-quotations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("supplier_quotations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: purchases } = useQuery({
    queryKey: ["admin-purchases-for-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_transactions")
        .select("*")
        .or("sub_type.eq.purchase,sub_type.eq.material,sub_type.eq.produto,sub_type.eq.equipamento")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ─── Mutations ───
  const upsertSupplier = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, contact_name: form.contact_name || null,
        phone: form.phone || null, email: form.email || null,
        notes: form.notes || null, category: form.category,
        website: form.website || null, city: form.city || null,
        state: form.state || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: form.status,
      };
      if (editingId) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success(editingId ? "Fornecedor atualizado!" : "Fornecedor cadastrado!");
      setDialogOpen(false); setEditingId(null); setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success("Fornecedor removido"); setSelectedId(null);
    },
  });

  const createQuotation = useMutation({
    mutationFn: async () => {
      const items = quotationForm.items.filter((it) => it.description).map((it) => ({
        description: it.description, qty: parseFloat(it.qty) || 1, unit_price: parseFloat(it.unit_price) || 0,
      }));
      const total = parseFloat(quotationForm.total) || items.reduce((s, it) => s + it.qty * it.unit_price, 0);
      const payload: any = {
        title: quotationForm.title, items, total,
        notes: quotationForm.notes || null,
        valid_until: quotationForm.valid_until || null,
        status: "pendente",
        category: quotationForm.category || "geral",
      };
      if (quotationForm.supplier_id) {
        payload.supplier_id = quotationForm.supplier_id;
        payload.supplier_name_external = null;
      } else {
        payload.supplier_id = null;
        payload.supplier_name_external = quotationForm.supplier_name_external || "Fornecedor externo";
      }
      const { error } = await supabase.from("supplier_quotations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-supplier-quotations"] });
      toast.success("Cotação registrada!");
      setQuotationDialogOpen(false); setQuotationForm(emptyQuotation);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateQuotationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status };
      if (status === "respondida" || status === "aprovada") update.responded_at = new Date().toISOString();
      const { error } = await supabase.from("supplier_quotations").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-supplier-quotations"] });
      toast.success("Status atualizado!");
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplier_quotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-supplier-quotations"] });
      toast.success("Cotação removida!");
    },
  });

  // ─── Helpers ───
  const getSupplierName = (q: any) => {
    if (q.supplier_id) {
      const s = suppliers?.find((s) => s.id === q.supplier_id);
      return s?.name || "Fornecedor removido";
    }
    return q.supplier_name_external || "Fornecedor externo";
  };

  const isRegistered = (q: any) => !!q.supplier_id && suppliers?.some((s) => s.id === q.supplier_id);

  // ─── Computed ───
  const enrichedSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.map((s) => {
      const sq = quotations?.filter((q) => q.supplier_id === s.id) || [];
      const approved = sq.filter((q) => q.status === "aprovada");
      return { ...s, quotationCount: sq.length, approvedQuotations: approved.length, totalApproved: approved.reduce((sum, q) => sum + Number(q.total), 0), supplierQuotations: sq };
    });
  }, [suppliers, quotations]);

  const kpis = useMemo(() => {
    const total = enrichedSuppliers.length;
    const active = enrichedSuppliers.filter((s) => s.status === "ativo").length;
    const totalQ = quotations?.length || 0;
    const pendingQ = quotations?.filter((q) => q.status === "pendente").length || 0;
    const totalPurchases = purchases?.reduce((s, p) => s + Number(p.amount), 0) || 0;
    const externalQ = quotations?.filter((q) => !q.supplier_id).length || 0;
    const internalQ = quotations?.filter((q) => !!q.supplier_id).length || 0;
    return { total, active, totalQ, pendingQ, totalPurchases, externalQ, internalQ };
  }, [enrichedSuppliers, quotations, purchases]);

  const filtered = useMemo(() => {
    return enrichedSuppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.contact_name || "").toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q) || (s.city || "").toLowerCase().includes(q) || (s.tags || []).some((t: string) => t.toLowerCase().includes(q));
      const matchCategory = filterCategory === "all" || s.category === filterCategory;
      const matchStatus = filterStatus === "all" || s.status === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [enrichedSuppliers, search, filterCategory, filterStatus]);

  const filteredQuotations = useMemo(() => {
    if (!quotations) return [];
    return quotations.filter((q) => {
      const name = getSupplierName(q).toLowerCase();
      const matchSearch = !qSearch || name.includes(qSearch.toLowerCase()) || q.title.toLowerCase().includes(qSearch.toLowerCase());
      const matchStatus = qFilterStatus === "all" || q.status === qFilterStatus;
      const matchCat = qFilterCategory === "all" || (q as any).category === qFilterCategory;
      return matchSearch && matchStatus && matchCat;
    });
  }, [quotations, qSearch, qFilterStatus, qFilterCategory, suppliers]);

  const comparedQuotations = useMemo(() => {
    if (compareIds.length < 2) return [];
    return (quotations || []).filter((q) => compareIds.includes(q.id));
  }, [quotations, compareIds]);

  const selected = enrichedSuppliers.find((s) => s.id === selectedId);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name, contact_name: s.contact_name || "", phone: s.phone || "",
      email: s.email || "", notes: s.notes || "", category: s.category || "geral",
      website: s.website || "", city: s.city || "", state: s.state || "",
      tags: (s.tags || []).join(", "), status: s.status || "ativo",
    });
    setDialogOpen(true);
  };

  const openNewQuotation = (supplierId?: string) => {
    setQuotationForm({ ...emptyQuotation, supplier_id: supplierId || "" });
    setQuotationDialogOpen(true);
  };

  const addQuotationItem = () => {
    setQuotationForm({ ...quotationForm, items: [...quotationForm.items, { description: "", qty: "1", unit_price: "" }] });
  };
  const removeQuotationItem = (i: number) => {
    setQuotationForm({ ...quotationForm, items: quotationForm.items.filter((_, idx) => idx !== i) });
  };
  const updateQuotationItem = (i: number, key: string, value: string) => {
    const items = [...quotationForm.items];
    (items[i] as any)[key] = value;
    setQuotationForm({ ...quotationForm, items });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id]);
  };

  const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        <div className={`${bg} ${color} p-1.5 rounded-lg`}><Icon className="h-3.5 w-3.5" /></div>
      </div>
      <span className="text-xl font-bold tabular-nums">{value}</span>
    </motion.div>
  );

  // ═══════════════════════════════════════════
  // SUPPLIER DETAIL VIEW
  // ═══════════════════════════════════════════
  if (selected) {
    const supplierQuotations = selected.supplierQuotations || [];
    return (
      <div className="max-w-[1400px] space-y-5">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>

        <div className="admin-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center text-lg font-bold text-accent">
                {selected.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{selected.name}</h1>
                  <Badge variant="outline" className="text-[10px] capitalize">{selected.category || "geral"}</Badge>
                  <Badge className={`text-[10px] border ${selected.status === "ativo" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                    {selected.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                  {selected.contact_name && <span>👤 {selected.contact_name}</span>}
                  {selected.city && <span><MapPin className="h-3 w-3 inline mr-0.5" />{selected.city}{selected.state ? `/${selected.state}` : ""}</span>}
                  {selected.phone && <span><Phone className="h-3 w-3 inline mr-0.5" />{selected.phone}</span>}
                  {selected.email && <span><Mail className="h-3 w-3 inline mr-0.5" />{selected.email}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {selected.phone && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(`https://wa.me/${selected.phone!.replace(/\D/g, "")}`, "_blank")}>
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openEdit(selected)}>
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Cotações" value={selected.quotationCount} icon={FileText} color="text-blue-400" bg="bg-blue-400/10" />
          <StatCard label="Aprovadas" value={selected.approvedQuotations} icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-400/10" />
          <StatCard label="Total Aprovado" value={fmtBRL(selected.totalApproved)} icon={DollarSign} color="text-accent" bg="bg-accent/10" />
          <div className="admin-card p-4 flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avaliação</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 cursor-pointer transition-colors ${s <= (selected.rating || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                  onClick={async () => {
                    await supabase.from("suppliers").update({ rating: s }).eq("id", selected.id);
                    queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/30 h-9">
            <TabsTrigger value="info" className="text-xs">Informações</TabsTrigger>
            <TabsTrigger value="quotations" className="text-xs">
              Cotações {supplierQuotations.length > 0 && <Badge className="ml-1.5 h-4 text-[9px] bg-blue-500/15 text-blue-400 border-0">{supplierQuotations.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Anotações</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="admin-card p-4 space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados de contato</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {selected.phone || "—"}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {selected.email || "—"}</div>
                  <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    {selected.website ? <a href={selected.website.startsWith("http") ? selected.website : `https://${selected.website}`} target="_blank" rel="noreferrer" className="text-accent underline">{selected.website}</a> : "—"}
                  </div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {selected.city || "—"}{selected.state ? ` / ${selected.state}` : ""}</div>
                </div>
              </div>
              <div className="admin-card p-4 space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags & Categorização</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs capitalize">{selected.category || "geral"}</Badge>
                  {(selected.tags || []).map((t: string) => (
                    <Badge key={t} className="text-[10px] bg-secondary/50 text-foreground border-border">{t}</Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Cadastrado em {new Date(selected.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quotations" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{supplierQuotations.length} cotação(ões)</p>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openNewQuotation(selected.id)}>
                <Plus className="h-3.5 w-3.5" /> Nova Cotação
              </Button>
            </div>
            {supplierQuotations.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma cotação registrada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {supplierQuotations.map((q: any, i: number) => (
                  <QuotationCard key={q.id} q={q} i={i} getSupplierName={getSupplierName} isRegistered={isRegistered}
                    updateQuotationStatus={updateQuotationStatus} deleteQuotation={deleteQuotation} showSupplier={false} compareIds={compareIds} toggleCompare={toggleCompare} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="admin-card p-5 max-w-lg space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anotações internas</h3>
              <Textarea value={form.notes !== undefined ? form.notes : selected.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="admin-input min-h-[200px] resize-none" placeholder="Anotações sobre esse fornecedor..." />
              <Button size="sm" className="gap-1.5 text-xs" onClick={async () => {
                const { error } = await supabase.from("suppliers").update({ notes: form.notes }).eq("id", selected.id);
                if (error) toast.error(error.message);
                else { toast.success("Anotações salvas!"); queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] }); }
              }}>Salvar anotações</Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="admin-card p-4 border-destructive/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Zona de perigo</p>
              <p className="text-[10px] text-muted-foreground">Excluir esse fornecedor e todas as cotações vinculadas</p>
            </div>
            <Button variant="destructive" size="sm" className="text-xs gap-1.5"
              onClick={() => { if (confirm(`Excluir ${selected.name}?`)) deleteSupplier.mutate(selected.id); }}>
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // MAIN VIEW — Tabs: Fornecedores | Cotações | Comparativo
  // ═══════════════════════════════════════════
  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Fornecedores & Cotações</h1>
          <p className="admin-page-subtitle">Pesquise, compare e gerencie parceiros e orçamentos</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openNewQuotation()}>
            <FileText className="h-3.5 w-3.5" /> Nova Cotação
          </Button>
          <Button size="sm" className="gap-1.5" onClick={openNew}>
            <Plus className="h-3.5 w-3.5" /> Novo Fornecedor
          </Button>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="bg-secondary/30 h-9">
          <TabsTrigger value="fornecedores" className="text-xs gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Fornecedores
          </TabsTrigger>
          <TabsTrigger value="cotacoes" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Cotações
            {kpis.totalQ > 0 && <Badge className="ml-1 h-4 text-[9px] bg-blue-500/15 text-blue-400 border-0">{kpis.totalQ}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="text-xs gap-1.5">
            <Scale className="h-3.5 w-3.5" /> Comparativo
            {compareIds.length >= 2 && <Badge className="ml-1 h-4 text-[9px] bg-accent/15 text-accent border-0">{compareIds.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB: FORNECEDORES ═══ */}
        <TabsContent value="fornecedores" className="mt-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Fornecedores" value={kpis.total} icon={Truck} color="text-foreground" bg="bg-secondary" />
            <StatCard label="Ativos" value={kpis.active} icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-400/10" />
            <StatCard label="Cotações" value={kpis.totalQ} icon={FileText} color="text-blue-400" bg="bg-blue-400/10" />
            <StatCard label="Pendentes" value={kpis.pendingQ} icon={Clock} color="text-amber-400" bg="bg-amber-400/10" />
            <StatCard label="Total Compras" value={fmtBRL(kpis.totalPurchases)} icon={ShoppingCart} color="text-violet-400" bg="bg-violet-400/10" />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar fornecedor..." className="admin-input pl-9" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categoryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Truck className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1.5" /> Cadastrar</Button>
            </div>
          ) : (
            <div className="admin-card overflow-hidden">
              <div className="hidden md:grid grid-cols-[44px_minmax(0,1.5fr)_100px_80px_100px_80px_60px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
                <span />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Fornecedor</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Categoria</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Avaliação</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Cotações</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Status</span>
                <span />
              </div>
              <div className="divide-y divide-border">
                {filtered.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                    className="grid grid-cols-[44px_minmax(0,1fr)_auto] md:grid-cols-[44px_minmax(0,1.5fr)_100px_80px_100px_80px_60px] gap-3 items-center px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer group"
                    onClick={() => { setSelectedId(s.id); setForm({ ...emptyForm, notes: s.notes || "" }); setActiveTab("info"); }}>
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">{s.name[0]?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {s.contact_name && <span>{s.contact_name}</span>}
                        {s.city && <span className="ml-1.5">· {s.city}{s.state ? `/${s.state}` : ""}</span>}
                        {!s.contact_name && !s.city && (s.phone || "Sem contato")}
                      </p>
                    </div>
                    <div className="hidden md:block"><Badge variant="outline" className="text-[9px] capitalize">{s.category || "geral"}</Badge></div>
                    <div className="hidden md:flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <Star key={r} className={`h-3 w-3 ${r <= (s.rating || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                    <div className="hidden md:flex justify-center"><span className="text-xs tabular-nums">{s.quotationCount}</span></div>
                    <div className="hidden md:flex justify-center">
                      <Badge className={`text-[9px] border ${s.status === "ativo" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                        {s.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="hidden md:flex justify-center"><Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: COTAÇÕES ═══ */}
        <TabsContent value="cotacoes" className="mt-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Cotações" value={kpis.totalQ} icon={FileText} color="text-blue-400" bg="bg-blue-400/10" />
            <StatCard label="Pendentes" value={kpis.pendingQ} icon={Clock} color="text-amber-400" bg="bg-amber-400/10" />
            <StatCard label="Fornecedores Cadastrados" value={kpis.internalQ} icon={Truck} color="text-emerald-400" bg="bg-emerald-400/10" />
            <StatCard label="Fornecedores Externos" value={kpis.externalQ} icon={ExternalLink} color="text-violet-400" bg="bg-violet-400/10" />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={qSearch} onChange={(e) => setQSearch(e.target.value)} placeholder="Buscar por fornecedor ou título..." className="admin-input pl-9" />
            </div>
            <Select value={qFilterStatus} onValueChange={setQFilterStatus}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="respondida">Respondida</SelectItem>
                <SelectItem value="aprovada">Aprovada</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={qFilterCategory} onValueChange={setQFilterCategory}>
              <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categoryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openNewQuotation()}>
              <Plus className="h-3.5 w-3.5" /> Nova Cotação
            </Button>
          </div>

          {compareIds.length > 0 && (
            <div className="admin-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-accent" />
                <span className="text-xs">{compareIds.length} cotação(ões) selecionada(s) para comparação</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setCompareIds([])}>Limpar</Button>
                {compareIds.length >= 2 && (
                  <Button size="sm" className="text-xs h-7 gap-1" onClick={() => setMainTab("comparativo")}>
                    <Scale className="h-3 w-3" /> Comparar
                  </Button>
                )}
              </div>
            </div>
          )}

          {filteredQuotations.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma cotação encontrada.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => openNewQuotation()}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Criar cotação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotations.map((q: any, i: number) => (
                <QuotationCard key={q.id} q={q} i={i} getSupplierName={getSupplierName} isRegistered={isRegistered}
                  updateQuotationStatus={updateQuotationStatus} deleteQuotation={deleteQuotation} showSupplier
                  compareIds={compareIds} toggleCompare={toggleCompare}
                  onViewSupplier={q.supplier_id ? () => { setSelectedId(q.supplier_id); setActiveTab("info"); setMainTab("fornecedores"); } : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: COMPARATIVO ═══ */}
        <TabsContent value="comparativo" className="mt-5 space-y-5">
          {comparedQuotations.length < 2 ? (
            <div className="text-center py-20">
              <Scale className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Selecione pelo menos 2 cotações na aba "Cotações" para comparar.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setMainTab("cotacoes")}>
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Ir para Cotações
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Comparando {comparedQuotations.length} cotações</h2>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setCompareIds([])}>Limpar seleção</Button>
              </div>

              {/* Comparison Table */}
              <div className="admin-card overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-36">Critério</th>
                      {comparedQuotations.map((q) => (
                        <th key={q.id} className="text-center p-3 min-w-[180px]">
                          <div className="font-semibold text-sm">{q.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                            {isRegistered(q) ? <Truck className="h-3 w-3 text-emerald-400" /> : <ExternalLink className="h-3 w-3 text-violet-400" />}
                            {getSupplierName(q)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-3 font-medium text-muted-foreground">Total</td>
                      {comparedQuotations.map((q) => {
                        const vals = comparedQuotations.map((x) => Number(x.total));
                        const minVal = Math.min(...vals);
                        const isBest = Number(q.total) === minVal;
                        return (
                          <td key={q.id} className={`p-3 text-center font-bold tabular-nums ${isBest ? "text-emerald-400" : ""}`}>
                            {fmtBRL(Number(q.total))}
                            {isBest && <span className="block text-[9px] font-normal text-emerald-400 mt-0.5">✓ Menor preço</span>}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-muted-foreground">Status</td>
                      {comparedQuotations.map((q) => (
                        <td key={q.id} className="p-3 text-center">
                          <Badge className={`text-[10px] border capitalize ${quotationStatusColors[q.status] || ""}`}>{q.status}</Badge>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-muted-foreground">Itens</td>
                      {comparedQuotations.map((q) => (
                        <td key={q.id} className="p-3 text-center">{Array.isArray(q.items) ? (q.items as any[]).length : 0}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-muted-foreground">Válida até</td>
                      {comparedQuotations.map((q) => (
                        <td key={q.id} className="p-3 text-center">
                          {q.valid_until ? new Date(q.valid_until + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-muted-foreground">Fornecedor cadastrado?</td>
                      {comparedQuotations.map((q) => (
                        <td key={q.id} className="p-3 text-center">
                          {isRegistered(q) ? <span className="text-emerald-400">✓ Sim</span> : <span className="text-muted-foreground">Externo</span>}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-muted-foreground">Observações</td>
                      {comparedQuotations.map((q) => (
                        <td key={q.id} className="p-3 text-center text-muted-foreground">{q.notes || "—"}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Item-level comparison */}
              <div className="admin-card p-4 space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Detalhamento por item</h3>
                {comparedQuotations.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{q.title}</span>
                      <span className="text-[10px] text-muted-foreground">({getSupplierName(q)})</span>
                    </div>
                    {Array.isArray(q.items) && (q.items as any[]).length > 0 ? (
                      <div className="bg-secondary/20 rounded-lg p-2 space-y-1">
                        {(q.items as any[]).map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs py-1 px-2">
                            <span>{it.description}</span>
                            <span className="tabular-nums text-muted-foreground">{it.qty}x {fmtBRL(it.unit_price)} = {fmtBRL(it.qty * it.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">Sem itens detalhados</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Supplier Form Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 bg-card border-border">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5 text-primary" />
              {editingId ? "Editar" : "Novo"} Fornecedor
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingId ? "Atualize os dados do fornecedor" : "Cadastre um novo parceiro comercial"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome da empresa *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" placeholder="Ex: Gold Banho Galvanoplastia" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="admin-input"><SelectValue /></SelectTrigger>
                  <SelectContent>{categoryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="admin-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Contato (pessoa)</Label>
                <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="admin-input" placeholder="Nome do contato" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="admin-input" placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="admin-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="admin-input" placeholder="www.example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cidade</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="admin-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Estado</Label>
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger className="admin-input"><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{stateOptions.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tags (separadas por vírgula)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="admin-input" placeholder="ouro, prata, zircônia, atacado" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="admin-input min-h-[60px] resize-none" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" disabled={!form.name || upsertSupplier.isPending} onClick={() => upsertSupplier.mutate()}>
              {upsertSupplier.isPending ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Quotation Dialog (independent) ─── */}
      <Dialog open={quotationDialogOpen} onOpenChange={setQuotationDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 bg-card border-border">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" /> Nova Cotação
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registre uma cotação de qualquer fornecedor — cadastrado ou não
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Supplier selection: registered or external name */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fornecedor</Label>
              <Select value={quotationForm.supplier_id || "__external"} onValueChange={(v) => {
                if (v === "__external") {
                  setQuotationForm({ ...quotationForm, supplier_id: "" });
                } else {
                  setQuotationForm({ ...quotationForm, supplier_id: v, supplier_name_external: "" });
                }
              }}>
                <SelectTrigger className="admin-input"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__external">🔗 Fornecedor externo (não cadastrado)</SelectItem>
                  {(suppliers || []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!quotationForm.supplier_id && (
                <Input value={quotationForm.supplier_name_external} onChange={(e) => setQuotationForm({ ...quotationForm, supplier_name_external: e.target.value })}
                  className="admin-input" placeholder="Nome do fornecedor externo" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Título da cotação *</Label>
                <Input value={quotationForm.title} onChange={(e) => setQuotationForm({ ...quotationForm, title: e.target.value })} className="admin-input" placeholder="Ex: Banho ouro 18k - Março" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <Select value={quotationForm.category} onValueChange={(v) => setQuotationForm({ ...quotationForm, category: v })}>
                  <SelectTrigger className="admin-input"><SelectValue /></SelectTrigger>
                  <SelectContent>{categoryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Itens</Label>
              {quotationForm.items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_28px] gap-2 items-end">
                  <Input value={item.description} onChange={(e) => updateQuotationItem(i, "description", e.target.value)} className="admin-input" placeholder="Descrição" />
                  <Input type="number" value={item.qty} onChange={(e) => updateQuotationItem(i, "qty", e.target.value)} className="admin-input" placeholder="Qtd" />
                  <Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateQuotationItem(i, "unit_price", e.target.value)} className="admin-input" placeholder="R$" />
                  {quotationForm.items.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-7" onClick={() => removeQuotationItem(i)}><X className="h-3 w-3" /></Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={addQuotationItem}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar item
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Total (R$)</Label>
                <Input type="number" step="0.01" value={quotationForm.total} onChange={(e) => setQuotationForm({ ...quotationForm, total: e.target.value })} className="admin-input" placeholder="Auto-calculado" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Válida até</Label>
                <Input type="date" value={quotationForm.valid_until} onChange={(e) => setQuotationForm({ ...quotationForm, valid_until: e.target.value })} className="admin-input" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações</Label>
              <Textarea value={quotationForm.notes} onChange={(e) => setQuotationForm({ ...quotationForm, notes: e.target.value })} className="admin-input min-h-[60px] resize-none" placeholder="Condições, prazo de entrega..." />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setQuotationDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" disabled={!quotationForm.title || createQuotation.isPending} onClick={() => createQuotation.mutate()}>
              {createQuotation.isPending ? "Salvando..." : "Registrar Cotação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ═══════════════════════════════════════════
// Quotation Card Component
// ═══════════════════════════════════════════
const QuotationCard = ({ q, i, getSupplierName, isRegistered, updateQuotationStatus, deleteQuotation, showSupplier, compareIds, toggleCompare, onViewSupplier }: any) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
    className={`admin-card p-4 space-y-3 transition-all ${compareIds.includes(q.id) ? "ring-1 ring-accent/50" : ""}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold truncate">{q.title}</h4>
          {showSupplier && (
            <div className="flex items-center gap-1">
              {isRegistered(q) ? <Truck className="h-3 w-3 text-emerald-400" /> : <ExternalLink className="h-3 w-3 text-violet-400" />}
              <span className="text-[10px] text-muted-foreground">{getSupplierName(q)}</span>
              {onViewSupplier && (
                <button onClick={(e) => { e.stopPropagation(); onViewSupplier(); }} className="text-[9px] text-accent hover:underline ml-1">ver</button>
              )}
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {new Date(q.requested_at || q.created_at).toLocaleDateString("pt-BR")}
          {q.valid_until && ` · Válida até ${new Date(q.valid_until + "T12:00:00").toLocaleDateString("pt-BR")}`}
          {(q as any).category && (q as any).category !== "geral" && ` · ${(q as any).category}`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={`text-[10px] border capitalize ${quotationStatusColors[q.status] || ""}`}>{q.status}</Badge>
        <span className="text-sm font-bold tabular-nums">{fmtBRL(Number(q.total))}</span>
      </div>
    </div>

    {Array.isArray(q.items) && (q.items as any[]).length > 0 && (
      <div className="bg-secondary/20 rounded-lg p-2 space-y-1">
        {(q.items as any[]).map((it: any, idx: number) => (
          <div key={idx} className="flex justify-between text-xs py-1 px-2">
            <span>{it.description}</span>
            <span className="tabular-nums text-muted-foreground">{it.qty}x {fmtBRL(it.unit_price)}</span>
          </div>
        ))}
      </div>
    )}

    {q.notes && <p className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-2">{q.notes}</p>}

    <div className="flex gap-2 flex-wrap items-center">
      {q.status === "pendente" && (
        <>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => updateQuotationStatus.mutate({ id: q.id, status: "respondida" })}>Marcar Respondida</Button>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => updateQuotationStatus.mutate({ id: q.id, status: "aprovada" })}>✓ Aprovar</Button>
        </>
      )}
      {q.status === "respondida" && (
        <>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => updateQuotationStatus.mutate({ id: q.id, status: "aprovada" })}>✓ Aprovar</Button>
          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => updateQuotationStatus.mutate({ id: q.id, status: "rejeitada" })}>✗ Rejeitar</Button>
        </>
      )}
      <Button size="sm" variant={compareIds.includes(q.id) ? "default" : "outline"} className="text-[10px] h-6 px-2 gap-1 ml-auto" onClick={() => toggleCompare(q.id)}>
        <Scale className="h-3 w-3" /> {compareIds.includes(q.id) ? "Selecionada" : "Comparar"}
      </Button>
      <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 text-muted-foreground hover:text-destructive"
        onClick={() => { if (confirm("Excluir cotação?")) deleteQuotation.mutate(q.id); }}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  </motion.div>
);

export default AdminFornecedores;
