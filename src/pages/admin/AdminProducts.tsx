import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useStore";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category_id: string;
  sizes: string;
  colors: string;
  is_featured: boolean;
  stock_status: boolean;
  images: string[];
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  sizes: "",
  colors: "",
  is_featured: false,
  stock_status: true,
  images: [],
};

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const { data: categories } = useCategories();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (form: ProductForm) => {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price) || 0,
        category_id: form.category_id || null,
        sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()) : [],
        colors: form.colors ? form.colors.split(",").map((s) => s.trim()) : [],
        is_featured: form.is_featured,
        stock_status: form.stock_status,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      newImages.push(urlData.publicUrl);
    }

    setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    setUploading(false);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      category_id: p.category_id || "",
      sizes: (p.sizes || []).join(", "),
      colors: (p.colors || []).join(", "),
      is_featured: p.is_featured,
      stock_status: p.stock_status,
      images: p.images || [],
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-serif font-semibold">Produtos</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2" size="sm">
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
              className="space-y-4"
            >
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" required />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Preço (R$)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl mt-1" required />
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Tamanhos (separados por vírgula)</Label>
                  <Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="rounded-xl mt-1" placeholder="P, M, G, GG" />
                </div>
                <div>
                  <Label className="text-xs">Cores (separadas por vírgula)</Label>
                  <Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="rounded-xl mt-1" placeholder="Preto, Branco" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  <Label className="text-xs">Destaque</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.stock_status} onCheckedChange={(v) => setForm({ ...form, stock_status: v })} />
                  <Label className="text-xs">Em estoque</Label>
                </div>
              </div>

              {/* Image upload */}
              <div>
                <Label className="text-xs">Imagens</Label>
                <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="rounded-xl mt-1" disabled={uploading} />
                {form.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt="" className="h-16 w-14 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product list */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : products && products.length > 0 ? (
          products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
              <div className="h-14 w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  R$ {p.price.toFixed(2).replace(".", ",")} · {(p.categories as any)?.name || "Sem categoria"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => { if (confirm("Excluir este produto?")) deleteMutation.mutate(p.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">Nenhum produto cadastrado.</p>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
