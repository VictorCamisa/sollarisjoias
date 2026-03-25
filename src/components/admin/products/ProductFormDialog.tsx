import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useStore";
import { Package, Image as ImageIcon, Tag, Settings2 } from "lucide-react";

export interface ProductForm {
  name: string; sku: string; description: string; price: string; original_price: string;
  category_id: string; sizes: string; colors: string; banho: string; pedra: string;
  material: string; weight_g: string; tags: string; tags_seo: string; priority: string;
  stock_quantity: string; is_featured: boolean; stock_status: boolean; internal_notes: string;
  foto_frontal: string; foto_lateral: string; foto_lifestyle: string; foto_detalhe: string;
  images: string[];
}

export const emptyForm: ProductForm = {
  name: "", sku: "", description: "", price: "", original_price: "",
  category_id: "", sizes: "", colors: "", banho: "", pedra: "",
  material: "", weight_g: "", tags: "", tags_seo: "", priority: "Média",
  stock_quantity: "0", is_featured: false, stock_status: true,
  internal_notes: "", foto_frontal: "", foto_lateral: "",
  foto_lifestyle: "", foto_detalhe: "", images: [],
};

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: ProductForm;
  setForm: (f: ProductForm) => void;
  editingId: string | null;
  onSaved: () => void;
}

export const ProductFormDialog = ({ open, onOpenChange, form, setForm, editingId, onSaved }: ProductFormDialogProps) => {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const saveMutation = useMutation({
    mutationFn: async () => {
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
      toast.success(editingId ? "Produto atualizado!" : "Produto criado!");
      onSaved();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast.error(`Erro: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      if (slot) {
        setForm({ ...form, [slot]: urlData.publicUrl });
      } else {
        setForm({ ...form, images: [...form.images, urlData.publicUrl] });
      }
    }
    setUploading(false);
  };

  const set = (key: keyof ProductForm, value: any) => setForm({ ...form, [key]: value });

  const FotoSlot = ({ label, field }: { label: string; field: keyof ProductForm }) => (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {(form[field] as string) ? (
        <div className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-border">
          <img src={form[field] as string} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => set(field, "")}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
          >
            ×
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center aspect-[3/4] rounded-lg border border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-secondary/20">
          <ImageIcon className="h-5 w-5 text-muted-foreground/40 mb-1" />
          <span className="text-[10px] text-muted-foreground">Upload</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, field)} disabled={uploading} />
        </label>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 bg-card border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            {editingId ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-3 border-b border-border">
              <TabsList className="bg-secondary/30 h-8">
                <TabsTrigger value="info" className="text-xs gap-1.5 h-7"><Package className="h-3 w-3" />Geral</TabsTrigger>
                <TabsTrigger value="media" className="text-xs gap-1.5 h-7"><ImageIcon className="h-3 w-3" />Mídia</TabsTrigger>
                <TabsTrigger value="details" className="text-xs gap-1.5 h-7"><Tag className="h-3 w-3" />Detalhes</TabsTrigger>
                <TabsTrigger value="seo" className="text-xs gap-1.5 h-7"><Settings2 className="h-3 w-3" />SEO & Notas</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* TAB: Info */}
              <TabsContent value="info" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome *</Label>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="admin-input" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">SKU</Label>
                    <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="admin-input" placeholder="BR-001" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="admin-input min-h-[80px] resize-none" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Preço "De"</Label>
                    <Input type="number" step="0.01" value={form.original_price} onChange={(e) => set("original_price", e.target.value)} className="admin-input" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Preço "Por" *</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className="admin-input" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Estoque</Label>
                    <Input type="number" value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria</Label>
                    <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                      <SelectTrigger className="admin-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Prioridade</Label>
                    <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                      <SelectTrigger className="admin-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">🔥 Alta</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
                    <Label className="text-xs">Produto em destaque</Label>
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Media */}
              <TabsContent value="media" className="mt-0 space-y-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Fotos do Produto (4 slots)</Label>
                  <div className="grid grid-cols-4 gap-3">
                    <FotoSlot label="Frontal" field="foto_frontal" />
                    <FotoSlot label="Lateral" field="foto_lateral" />
                    <FotoSlot label="Lifestyle" field="foto_lifestyle" />
                    <FotoSlot label="Detalhe" field="foto_detalhe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Imagens extras</Label>
                  <label className="flex flex-col items-center justify-center py-6 rounded-lg border border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-secondary/20">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40 mb-1" />
                    <span className="text-xs text-muted-foreground">Clique para enviar imagens</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e)} disabled={uploading} />
                  </label>
                  {form.images.length > 0 && (
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {form.images.map((img, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                            className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Details */}
              <TabsContent value="details" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Banho</Label>
                    <Input value={form.banho} onChange={(e) => set("banho", e.target.value)} className="admin-input" placeholder="Ouro 18k" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pedra</Label>
                    <Input value={form.pedra} onChange={(e) => set("pedra", e.target.value)} className="admin-input" placeholder="Zircônia" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Material</Label>
                    <Input value={form.material} onChange={(e) => set("material", e.target.value)} className="admin-input" placeholder="Aço inoxidável" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Peso (g)</Label>
                    <Input type="number" step="0.1" value={form.weight_g} onChange={(e) => set("weight_g", e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tamanhos (vírgula)</Label>
                    <Input value={form.sizes} onChange={(e) => set("sizes", e.target.value)} className="admin-input" placeholder="P, M, G" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cores (vírgula)</Label>
                    <Input value={form.colors} onChange={(e) => set("colors", e.target.value)} className="admin-input" placeholder="Dourado, Prata" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tags (vírgula)</Label>
                  <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} className="admin-input" placeholder="argola, festa, presente" />
                </div>
              </TabsContent>

              {/* TAB: SEO */}
              <TabsContent value="seo" className="mt-0 space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tags SEO</Label>
                  <Input value={form.tags_seo} onChange={(e) => set("tags_seo", e.target.value)} className="admin-input" placeholder="brinco folheado ouro 18k" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observação Interna</Label>
                  <Textarea value={form.internal_notes} onChange={(e) => set("internal_notes", e.target.value)} className="admin-input min-h-[100px] resize-none" placeholder="Notas visíveis apenas no admin..." />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={saveMutation.isPending || !form.name || !form.price}>
              {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
