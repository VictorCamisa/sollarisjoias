import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Image as ImageIcon, Eye, Pencil, Trash2, Camera, Tag, AlertTriangle } from "lucide-react";
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
  const [filterStock, setFilterStock] = useState("all");
  const [filterPhoto, setFilterPhoto] = useState("all");
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

  const hasPhoto = (p: any) =>
    !!(p.foto_frontal || p.foto_lateral || p.foto_lifestyle || p.foto_detalhe || p.images?.length);

  const filtered = products?.filter((p) => {
    const s = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s));
    const matchCat = filterCategory === "all" || p.category_id === filterCategory;
    const matchPri = filterPriority === "all" || p.priority === filterPriority;
    const qty = p.stock_quantity ?? 0;
    const matchStock =
      filterStock === "all" ? true :
      filterStock === "out" ? qty === 0 :
      filterStock === "low" ? qty > 0 && qty < 5 :
      filterStock === "ok" ? qty >= 5 : true;
    const matchPhoto =
      filterPhoto === "all" ? true :
      filterPhoto === "with" ? hasPhoto(p) :
      filterPhoto === "without" ? !hasPhoto(p) : true;
    return matchSearch && matchCat && matchPri && matchStock && matchPhoto;
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
    withPhotos: products?.filter(hasPhoto).length ?? 0,
    withoutSeo: products?.filter((p) => !p.tags_seo).length ?? 0,
    avgPrice: products?.length
      ? products.reduce((s, p) => s + Number(p.price), 0) / products.length
      : 0,
    withDiscount: products?.filter((p) => p.original_price && p.original_price > p.price).length ?? 0,
  };

  const activeFiltersCount = [
    filterCategory !== "all",
    filterPriority !== "all",
    filterStock !== "all",
    filterPhoto !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory("all");
    setFilterPriority("all");
    setFilterStock("all");
    setFilterPhoto("all");
    setSearch("");
  };

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Produtos</h1>
          <p className="admin-page-subtitle">
            {filtered?.length ?? 0} de {products?.length ?? 0} produtos
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="ml-2 text-primary hover:underline text-[10px]">
                limpar filtros ({activeFiltersCount})
              </button>
            )}
          </p>
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
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-28 h-9 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridade</SelectItem>
            <SelectItem value="Alta">🔥 Alta</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStock} onValueChange={setFilterStock}>
          <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Estoque" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo estoque</SelectItem>
            <SelectItem value="ok">✅ Disponível</SelectItem>
            <SelectItem value="low">⚠️ Estoque baixo</SelectItem>
            <SelectItem value="out">❌ Esgotado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPhoto} onValueChange={setFilterPhoto}>
          <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Fotos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas fotos</SelectItem>
            <SelectItem value="with">📷 Com foto</SelectItem>
            <SelectItem value="without">🚫 Sem foto</SelectItem>
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
          <p className="text-sm text-muted-foreground">
            {activeFiltersCount > 0 ? "Nenhum produto com esses filtros." : "Nenhum produto encontrado."}
          </p>
          {activeFiltersCount > 0 ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Limpar filtros</Button>
          ) : (
            <Button variant="outline" size="sm" className="mt-4" onClick={openNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Cadastrar produto
            </Button>
          )}
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[44px_minmax(0,1.6fr)_90px_90px_70px_60px_60px_80px] gap-3 px-4 py-2.5 border-b border-border bg-secondary/20">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Foto</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Produto</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Categoria</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Preço</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Estoque</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Mídia</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">SEO</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Ações</span>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((p, i) => {
              const qty = p.stock_quantity ?? 0;
              const hasPic = hasPhoto(p);
              const hasSeo = !!p.tags_seo;
              const discount = p.original_price && p.original_price > p.price
                ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
                : null;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="grid grid-cols-[44px_minmax(0,1fr)_auto] md:grid-cols-[44px_minmax(0,1.6fr)_90px_90px_70px_60px_60px_80px] gap-3 items-center px-4 py-3 hover:bg-secondary/20 transition-colors group"
                >
                  {/* Photo thumbnail */}
                  <div
                    className="h-10 w-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0 border border-border cursor-pointer"
                    onClick={() => setSelectedProduct(p)}
                  >
                    {(p.foto_frontal || p.images?.[0]) ? (
                      <img src={p.foto_frontal || p.images?.[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Name + badges */}
                  <div className="min-w-0 cursor-pointer" onClick={() => setSelectedProduct(p)}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[13px] font-medium truncate">{p.name}</p>
                      {p.is_featured && <span className="text-[10px] shrink-0">⭐</span>}
                      {qty === 0 && (
                        <Badge variant="destructive" className="text-[8px] h-4 px-1 shrink-0">Esgotado</Badge>
                      )}
                      {discount && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1 shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          -{discount}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {p.sku && <span className="font-mono mr-1.5">{p.sku}</span>}
                      {p.banho && <span>{p.banho}</span>}
                      {p.pedra && <span className="ml-1">· {p.pedra}</span>}
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
                        qty === 0
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : qty < 5
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {qty}
                    </Badge>
                  </div>

                  {/* Photo indicator */}
                  <div className="hidden md:flex justify-center">
                    {hasPic ? (
                      <Camera className="h-3.5 w-3.5 text-emerald-400" title="Tem foto" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-muted-foreground/30" title="Sem foto" />
                    )}
                  </div>

                  {/* SEO indicator */}
                  <div className="hidden md:flex justify-center">
                    {hasSeo ? (
                      <Tag className="h-3.5 w-3.5 text-emerald-400" title="SEO configurado" />
                    ) : (
                      <Tag className="h-3.5 w-3.5 text-amber-400/60" title="Sem tags SEO" />
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="hidden md:flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      title="Ver detalhes"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      title="Editar produto"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${p.name}"?`)) deleteMutation.mutate(p.id);
                      }}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      title="Excluir produto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights panel — shown when there are actionable gaps */}
      {!isLoading && products && products.length > 0 && (stats.withoutSeo > 0 || stats.total - stats.withPhotos > 0) && (
        <div className="flex flex-wrap gap-2">
          {stats.total - stats.withPhotos > 0 && (
            <button
              onClick={() => setFilterPhoto("without")}
              className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-1.5 hover:bg-amber-400/15 transition-colors"
            >
              <Camera className="h-3 w-3" />
              {stats.total - stats.withPhotos} produto{stats.total - stats.withPhotos !== 1 ? "s" : ""} sem foto
            </button>
          )}
          {stats.withoutSeo > 0 && (
            <button
              onClick={() => {
                setFilterPhoto("all");
                setFilterStock("all");
                // Filter to show products without SEO by opening one
                toast.info(`${stats.withoutSeo} produtos sem tags SEO — abra cada produto e clique em "Otimizar SEO"`);
              }}
              className="flex items-center gap-1.5 text-[11px] text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-lg px-3 py-1.5 hover:bg-blue-400/15 transition-colors"
            >
              <Tag className="h-3 w-3" />
              {stats.withoutSeo} produto{stats.withoutSeo !== 1 ? "s" : ""} sem SEO
            </button>
          )}
          {stats.outOfStock > 0 && (
            <button
              onClick={() => setFilterStock("out")}
              className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-1.5 hover:bg-red-400/15 transition-colors"
            >
              <AlertTriangle className="h-3 w-3" />
              {stats.outOfStock} produto{stats.outOfStock !== 1 ? "s" : ""} esgotado{stats.outOfStock !== 1 ? "s" : ""}
            </button>
          )}
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
