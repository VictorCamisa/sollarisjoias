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
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useStore";

interface ProductForm {
  name: string;
  sku: string;
  description: string;
  price: string;
  original_price: string;
  category_id: string;
  sizes: string;
  colors: string;
  banho: string;
  pedra: string;
  material: string;
  weight_g: string;
  tags: string;
  tags_seo: string;
  priority: string;
  stock_quantity: string;
  is_featured: boolean;
  stock_status: boolean;
  internal_notes: string;
  foto_frontal: string;
  foto_lateral: string;
  foto_lifestyle: string;
  foto_detalhe: string;
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
        name: form.name,
        sku: form.sku || null,
        description: form.description || null,
        price: parseFloat(form.price) || 0,
        original_price: parseFloat(form.original_price) || null,
        category_id: form.category_id || null,
        sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()) : [],
        colors: form.colors ? form.colors.split(",").map((s) => s.trim()) : [],
        banho: form.banho || null,
        pedra: form.pedra || null,
        material: form.material || null,
        weight_g: parseFloat(form.weight_g) || null,
        tags: form.tags ? form.tags.split(",").map((s) => s.trim()) : [],
        tags_seo: form.tags_seo || null,
        priority: form.priority,
        stock_quantity: stockQty,
        stock_status: stockQty > 0,
        is_featured: form.is_featured || form.priority === "Alta",
        internal_notes: form.internal_notes || null,
        foto_frontal: form.foto_frontal || null,
        foto_lateral: form.foto_lateral || null,
        foto_lifestyle: form.foto_lifestyle || null,
        foto_detalhe: form.foto_detalhe || null,
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
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
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
      name: p.name,
      sku: p.sku || "",
      description: p.description || "",
      price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : "",
      category_id: p.category_id || "",
      sizes: (p.sizes || []).join(", "),
      colors: (p.colors || []).join(", "),
      banho: p.banho || "",
      pedra: p.pedra || "",
      material: p.material || "",
      weight_g: p.weight_g ? String(p.weight_g) : "",
      tags: (p.tags || []).join(", "),
      tags_seo: p.tags_seo || "",
      priority: p.priority || "Média",
      stock_quantity: String(p.stock_quantity ?? 0),
      is_featured: p.is_featured,
      stock_status: p.stock_status,
      internal_notes: p.internal_notes || "",
      foto_frontal: p.foto_frontal || "",
      foto_lateral: p.foto_lateral || "",
      foto_lifestyle: p.foto_lifestyle || "",
      foto_detalhe: p.foto_detalhe || "",
      images: p.images || [],
    });
    setOpen(true);
  };

  const FotoSlot = ({ label, field }: { label: string; field: string }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        {(form as any)[field] ? (
          <div className="relative group">
            <img src={(form as any)[field]} alt="" className="h-16 w-14 object-cover rounded-lg" />
            <button type="button" onClick={() => setForm({ ...form, [field]: "" })}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
          </div>
        ) : (
          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, field)} className="rounded-xl text-xs" disabled={uploading} />
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Produtos</h1>
          <p className="text-xs text-muted-foreground mt-1">{filtered?.length ?? 0} de {products?.length ?? 0} produtos</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2" size="sm"><Plus className="h-4 w-4" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs">Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" required />
                </div>
                <div>
                  <Label className="text-xs">SKU</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded-xl mt-1" placeholder="BR-001" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" rows={3} />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Preço "De" (R$)</Label>
                  <Input type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Preço "Por" (R$) *</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl mt-1" required />
                </div>
                <div>
                  <Label className="text-xs">Estoque</Label>
                  <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="rounded-xl mt-1" />
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">🔥 Alta</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Attributes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Banho</Label>
                  <Input value={form.banho} onChange={(e) => setForm({ ...form, banho: e.target.value })} className="rounded-xl mt-1" placeholder="Ouro 18k" />
                </div>
                <div>
                  <Label className="text-xs">Pedra</Label>
                  <Input value={form.pedra} onChange={(e) => setForm({ ...form, pedra: e.target.value })} className="rounded-xl mt-1" placeholder="Zircônia" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Material</Label>
                  <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="rounded-xl mt-1" placeholder="Aço inoxidável" />
                </div>
                <div>
                  <Label className="text-xs">Peso (g)</Label>
                  <Input type="number" step="0.1" value={form.weight_g} onChange={(e) => setForm({ ...form, weight_g: e.target.value })} className="rounded-xl mt-1" />
                </div>
              </div>

              {/* Variations */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Tamanhos (vírgula)</Label>
                  <Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="rounded-xl mt-1" placeholder="P, M, G" />
                </div>
                <div>
                  <Label className="text-xs">Cores / Banhos (vírgula)</Label>
                  <Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="rounded-xl mt-1" placeholder="Dourado, Prata" />
                </div>
              </div>

              {/* Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Tags / Subcategorias (vírgula)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="rounded-xl mt-1" placeholder="argola, festa" />
                </div>
                <div>
                  <Label className="text-xs">Tags SEO</Label>
                  <Input value={form.tags_seo} onChange={(e) => setForm({ ...form, tags_seo: e.target.value })} className="rounded-xl mt-1" />
                </div>
              </div>

              {/* Switches */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  <Label className="text-xs">Destaque</Label>
                </div>
              </div>

              {/* Photo slots */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Fotos (4 slots)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <FotoSlot label="Foto Frontal" field="foto_frontal" />
                  <FotoSlot label="Foto Lateral" field="foto_lateral" />
                  <FotoSlot label="Foto Lifestyle" field="foto_lifestyle" />
                  <FotoSlot label="Foto Detalhe" field="foto_detalhe" />
                </div>
              </div>

              {/* Extra images */}
              <div>
                <Label className="text-xs">Imagens extras</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e)} className="rounded-xl mt-1" disabled={uploading} />
                {form.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt="" className="h-16 w-14 object-cover rounded-lg" />
                        <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal notes */}
              <div>
                <Label className="text-xs">Observação Interna (admin + IA)</Label>
                <Textarea value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} className="rounded-xl mt-1" rows={2}
                  placeholder="Ex: Mais vendido, tendência 2026, combina com colar X..." />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome ou SKU..." className="rounded-xl pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Alta">🔥 Alta</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : filtered && filtered.length > 0 ? (
          filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
              <div className="h-14 w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                {(p.foto_frontal || p.images?.[0]) && <img src={p.foto_frontal || p.images?.[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  {p.priority === "Alta" && <span className="text-xs">🔥</span>}
                  {(p.stock_quantity ?? 0) < 5 && (p.stock_quantity ?? 0) > 0 && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.sku && <span className="mr-2">{p.sku}</span>}
                  R$ {p.price.toFixed(2).replace(".", ",")}
                  {" · "}{(p.categories as any)?.name || "Sem categoria"}
                  {" · "}{p.stock_quantity ?? 0} un.
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                  onClick={() => { if (confirm("Excluir este produto?")) deleteMutation.mutate(p.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">Nenhum produto encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
