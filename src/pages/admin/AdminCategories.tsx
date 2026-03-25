import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderOpen, Search, Package, Layers, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Get product counts per category
  const { data: productCounts } = useQuery({
    queryKey: ["admin-category-product-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("category_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((p) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filtered = categories?.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const generateSlug = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = generateSlug(name);
      if (editingId) {
        const { error } = await supabase.from("categories").update({ name, slug }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert({ name, slug });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(editingId ? "Categoria atualizada!" : "Categoria criada!");
      setOpen(false); setEditingId(null); setName("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const count = productCounts?.[id] || 0;
      if (count > 0) {
        throw new Error(`Esta categoria possui ${count} produto(s). Remova-os antes de excluir.`);
      }
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria excluída!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalProducts = Object.values(productCounts || {}).reduce((s, c) => s + c, 0);
  const emptyCategories = categories?.filter((c) => !(productCounts?.[c.id])).length ?? 0;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Categorias</h1>
          <p className="admin-page-subtitle">{categories?.length ?? 0} categorias cadastradas</p>
        </div>
        <Button size="sm" onClick={() => { setEditingId(null); setName(""); setOpen(true); }} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nova Categoria
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Total Categorias", value: categories?.length ?? 0, icon: Layers, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Produtos", value: totalProducts, icon: Package, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Sem Produtos", value: emptyCategories, icon: FolderOpen, color: "text-orange-400", bg: "bg-orange-400/10" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="admin-card p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
              <div className={`${card.bg} ${card.color} p-1.5 rounded-lg`}>
                <card.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <span className="text-xl font-bold tabular-nums">{card.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar categoria..." className="admin-input pl-9" />
      </div>

      {/* Categories grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-card/50 rounded-lg animate-pulse" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-20">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}
          </p>
          {!search && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Criar primeira categoria
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => {
            const count = productCounts?.[c.id] || 0;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="admin-card p-4 flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{c.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">/{c.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingId(c.id); setName(c.name); setOpen(true); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`Excluir "${c.name}"?`)) deleteMutation.mutate(c.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {count} {count === 1 ? "produto" : "produtos"}
                    </span>
                  </div>
                  {count === 0 && (
                    <Badge variant="outline" className="text-[9px] bg-orange-500/10 text-orange-400 border-orange-500/20">
                      Vazia
                    </Badge>
                  )}
                  {count > 0 && (
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Ativa
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setName(""); } }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {editingId ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome da categoria</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="admin-input" placeholder="Ex: Brincos" required />
              {name && (
                <p className="text-[10px] text-muted-foreground">
                  Slug: <span className="font-mono text-foreground/70">/{generateSlug(name)}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="flex-1" disabled={saveMutation.isPending || !name.trim()}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
