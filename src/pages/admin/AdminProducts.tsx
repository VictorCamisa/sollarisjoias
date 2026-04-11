import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Image as ImageIcon, Eye } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useStore";
import { motion } from "framer-motion";
import { ProductStatsCards } from "@/components/admin/products/ProductStatsCards";
import { ProductFormDialog, emptyForm, type ProductForm } from "@/components/admin/products/ProductFormDialog";
import { ProductDetailDrawer } from "@/components/admin/products/ProductDetailDrawer";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { data: categories } = useCategories();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = products?.filter((p) => {
    const s = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s));
    const matchCat = filterCategory === "all" || p.category_id === filterCategory;
    const matchPri = filterPriority === "all" || p.priority === filterPriority;
    return matchSearch && matchCat && matchPri;
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído!");
    },
  });

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name, sku: p.sku || "", description: p.description || "",
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
      category_id: p.category_id || "", sizes: (p.sizes || []).join(", "),
      colors: (p.colors || []).join(", "), banho: p.banho || "", pedra: p.pedra || "",
      material: p.material || "", weight_g: p.weight_g ? String(p.weight_g) : "",
      tags: (p.tags || []).join(", "), tags_seo: p.tags_seo || "",
      priority: p.priority || "Média", stock_quantity: String(p.stock_quantity ?? 0),
      is_featured: p.is_featured, stock_status: p.stock_status,
      internal_notes: p.internal_notes || "", foto_frontal: p.foto_frontal || "",
      foto_lateral: p.foto_lateral || "", foto_lifestyle: p.foto_lifestyle || "",
      foto_detalhe: p.foto_detalhe || "", images: p.images || [],
    });
    setFormOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const stats = {
    total: products?.length ?? 0,
    outOfStock: products?.filter((p) => (p.stock_quantity ?? 0) === 0).length ?? 0,
    lowStock: products?.filter((p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) < 5).length ?? 0,
    featured: products?.filter((p) => p.is_featured).length ?? 0,
    totalValue: products?.reduce((s, p) => s + Number(p.price) * (p.stock_quantity ?? 0), 0) ?? 0,
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Produtos</h1>
          <p className="admin-page-subtitle">{filtered?.length ?? 0} de {products?.length ?? 0} produtos</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Novo Produto
        </Button>
      </div>

      {/* Stats */}
      <ProductStatsCards stats={stats} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou SKU..." className="admin-input pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-28 h-9 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Alta">🔥 Alta</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-20">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Cadastrar produto
          </Button>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[44px_minmax(0,1.5fr)_100px_100px_70px_70px_32px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Foto</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Produto</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Categoria</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Preço</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Estoque</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Prior.</span>
            <span />
          </div>

          <div className="divide-y divide-border">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
                className="grid grid-cols-[44px_minmax(0,1fr)_auto] md:grid-cols-[44px_minmax(0,1.5fr)_100px_100px_70px_70px_32px] gap-3 items-center px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer group"
                onClick={() => setSelectedProduct(p)}
              >
                {/* Photo */}
                <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0 border border-border">
                  {(p.foto_frontal || p.images?.[0]) ? (
                    <img src={p.foto_frontal || p.images?.[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-medium truncate">{p.name}</p>
                    {p.is_featured && <span className="text-[10px]">⭐</span>}
                    {(p.stock_quantity ?? 0) === 0 && (
                      <Badge variant="destructive" className="text-[8px] h-4 px-1 shrink-0">Esgotado</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {p.sku && <span className="font-mono mr-1.5">{p.sku}</span>}
                    {p.banho && <span>{p.banho}</span>}
                  </p>
                </div>

                {/* Category */}
                <span className="hidden md:block text-xs text-muted-foreground truncate">
                  {(p.categories as any)?.name || "—"}
                </span>

                {/* Price */}
                <div className="hidden md:block text-right">
                  {p.original_price && p.original_price > p.price && (
                    <p className="text-[10px] text-muted-foreground line-through tabular-nums">{fmt(p.original_price)}</p>
                  )}
                  <p className="text-xs font-semibold tabular-nums">{fmt(p.price)}</p>
                </div>

                {/* Stock */}
                <div className="hidden md:flex justify-center">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      (p.stock_quantity ?? 0) === 0
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : (p.stock_quantity ?? 0) < 5
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {p.stock_quantity ?? 0}
                  </Badge>
                </div>

                {/* Priority */}
                <div className="hidden md:flex justify-center">
                  <Badge variant="outline" className="text-[10px]">
                    {p.priority === "Alta" ? "🔥" : p.priority || "Média"}
                  </Badge>
                </div>

                {/* View icon */}
                <div className="hidden md:flex justify-center">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}
        form={form}
        setForm={setForm}
        editingId={editingId}
        onSaved={() => { setFormOpen(false); setEditingId(null); setForm(emptyForm); }}
      />
      <ProductDetailDrawer
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(v) => !v && setSelectedProduct(null)}
        onEdit={openEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
};

export default AdminProducts;
