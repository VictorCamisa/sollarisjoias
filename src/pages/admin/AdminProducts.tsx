import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useStore";
import { motion } from "framer-motion";

interface ProductForm {
  name: string; sku: string; description: string; price: string; original_price: string;
  category_id: string; sizes: string; colors: string; banho: string; pedra: string;
  material: string; weight_g: string; tags: string; tags_seo: string; priority: string;
  stock_quantity: string; is_featured: boolean; stock_status: boolean; internal_notes: string;
  foto_frontal: string; foto_lateral: string; foto_lifestyle: string; foto_detalhe: string;
  images: string[];
}

const emptyForm: ProductForm = {
  name: "", sku: "", description: "", price: "", original_price: "",
  category_id: "", sizes: "", colors: "", banho: "", pedra: "",
  material: "", weight_g: "", tags: "", tags_seo: "", priority: "Média",
  stock_quantity: "0", is_featured: false, stock_status: true,
  internal_notes: "", foto_frontal: "", foto_lateral: "",
  foto_lifestyle: "", foto_detalhe: "", images: [],
};

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
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
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCategory === "all" || p.category_id === filterCategory;
    const matchPri = filterPriority === "all" || p.priority === filterPriority;
    return matchSearch && matchCat && matchPri;
  });

  const saveMutation = useMutation({
    mutationFn: async (form: ProductForm) => {
      const stockQty = parseInt(form.stock_quantity) || 0;
      const payload = {
        name: form.name, sku: form.sku || null, description: form.description || null,
        price: parseFloat(form.price) || 0, original_price: parseFloat(form.original_price) || null,
        category_id: form.category_id || null,
        sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()) : [],
        colors: form.colors ? form.colors.split(",").map((s) => s.trim()) : [],
        banho: form.banho || null, pedra: form.pedra || null, material: form.material || null,
        weight_g: parseFloat(form.weight_g) || null,
        tags: form.tags ? form.tags.split(",").map((s) => s.trim()) : [],
        tags_seo: form.tags_seo || null, priority: form.priority,
        stock_quantity: stockQty, stock_status: stockQty > 0,
        is_featured: form.is_featured || form.priority === "Alta",
        internal_notes: form.internal_notes || null,
        foto_frontal: form.foto_frontal || null, foto_lateral: form.foto_lateral || null,
        foto_lifestyle: form.foto_lifestyle || null, foto_detalhe: form.foto_detalhe || null,
        images: form.images,
      };
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-count"] });
      toast.success(editingId ? "Produto atualizado!" : "Produto criado!");
      setOpen(false); setEditingId(null); setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-count"] });
      toast.success("Produto excluído!");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      if (slot) {
        setForm((prev) => ({ ...prev, [slot]: urlData.publicUrl }));
      } else {
        setForm((prev) => ({ ...prev, images: [...prev.images, urlData.publicUrl] }));
      }
    }
    setUploading(false);
  };

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
    setOpen(true);
  };

  const FotoSlot = ({ label, field }: { label: string; field: string }) => (
    <div>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="flex gap-2 mt-1">
        {(form as any)[field] ? (
          <div className="relative group">
            <img src={(form as any)[field]} alt="" className="h-16 w-14 object-cover rounded-lg border border-border" />
            <button type="button" onClick={() => setForm({ ...form, [field]: "" })}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
          </div>
        ) : (
          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, field)} className="rounded-lg text-xs h-8" disabled={uploading} />
        )}
      </div>
    </div>
  );

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Produtos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered?.length ?? 0} de {products?.length ?? 0} produtos
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-lg gap-2 h-9 text-xs" size="sm"><Plus className="h-3.5 w-3.5" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg mt-1 h-9" required />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">SKU</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded-lg mt-1 h-9" placeholder="BR-001" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Preço "De"</Label>
                  <Input type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="rounded-lg mt-1 h-9" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Preço "Por" *</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-lg mt-1 h-9" required />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Estoque</Label>
                  <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="rounded-lg mt-1 h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="rounded-lg mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">🔥 Alta</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Banho</Label>
                  <Input value={form.banho} onChange={(e) => setForm({ ...form, banho: e.target.value })} className="rounded-lg mt-1 h-9" placeholder="Ouro 18k" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pedra</Label>
                  <Input value={form.pedra} onChange={(e) => setForm({ ...form, pedra: e.target.value })} className="rounded-lg mt-1 h-9" placeholder="Zircônia" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Material</Label>
                  <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="rounded-lg mt-1 h-9" placeholder="Aço inoxidável" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Peso (g)</Label>
                  <Input type="number" step="0.1" value={form.weight_g} onChange={(e) => setForm({ ...form, weight_g: e.target.value })} className="rounded-lg mt-1 h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tamanhos (vírgula)</Label>
                  <Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="rounded-lg mt-1 h-9" placeholder="P, M, G" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cores (vírgula)</Label>
                  <Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="rounded-lg mt-1 h-9" placeholder="Dourado, Prata" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tags (vírgula)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="rounded-lg mt-1 h-9" placeholder="argola, festa" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tags SEO</Label>
                  <Input value={form.tags_seo} onChange={(e) => setForm({ ...form, tags_seo: e.target.value })} className="rounded-lg mt-1 h-9" />
                </div>
              </div>
              <div className="flex items-center gap-6 py-1">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  <Label className="text-xs">Destaque</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fotos (4 slots)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <FotoSlot label="Frontal" field="foto_frontal" />
                  <FotoSlot label="Lateral" field="foto_lateral" />
                  <FotoSlot label="Lifestyle" field="foto_lifestyle" />
                  <FotoSlot label="Detalhe" field="foto_detalhe" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Imagens extras</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e)} className="rounded-lg mt-1 h-9" disabled={uploading} />
                {form.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt="" className="h-14 w-12 object-cover rounded-lg border border-border" />
                        <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observação Interna</Label>
                <Textarea value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} className="rounded-lg mt-1" rows={2} />
              </div>
              <Button type="submit" className="w-full rounded-lg h-9" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome ou SKU..." className="rounded-lg pl-9 h-9 text-xs" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-36 rounded-lg h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-28 rounded-lg h-9 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Alta">🔥 Alta</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-16">
          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[auto_1fr_100px_100px_80px_80px_70px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <span className="w-10">Foto</span>
            <span>Produto</span>
            <span>Categoria</span>
            <span className="text-right">Preço</span>
            <span className="text-center">Estoque</span>
            <span className="text-center">Prior.</span>
            <span></span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_100px_100px_80px_80px_70px] gap-3 items-center px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                  {(p.foto_frontal || p.images?.[0]) ? (
                    <img src={p.foto_frontal || p.images?.[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-medium truncate">{p.name}</p>
                    {p.priority === "Alta" && <span className="text-[10px]">🔥</span>}
                    {(p.stock_quantity ?? 0) === 0 && <Badge variant="destructive" className="text-[8px] h-4 px-1">Esgotado</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {p.sku && <span className="mr-1.5 font-mono">{p.sku}</span>}
                    {p.banho && <span className="mr-1.5">{p.banho}</span>}
                  </p>
                </div>
                <span className="hidden md:block text-xs text-muted-foreground truncate">{(p.categories as any)?.name || "—"}</span>
                <div className="hidden md:block text-right">
                  {p.original_price && p.original_price > p.price && (
                    <p className="text-[10px] text-muted-foreground line-through">{fmt(p.original_price)}</p>
                  )}
                  <p className="text-xs font-semibold">{fmt(p.price)}</p>
                </div>
                <div className="hidden md:flex justify-center">
                  <Badge variant={(p.stock_quantity ?? 0) === 0 ? "destructive" : (p.stock_quantity ?? 0) < 5 ? "outline" : "secondary"} className="text-[10px]">
                    {p.stock_quantity ?? 0}
                  </Badge>
                </div>
                <div className="hidden md:flex justify-center">
                  <Badge variant="outline" className="text-[10px]">{p.priority || "Média"}</Badge>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate(p.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
