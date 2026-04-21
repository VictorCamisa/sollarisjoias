import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useStore";
import {
  Package, Image as ImageIcon, Tag, Settings2,
  Sparkles, Loader2, CheckCircle2, RefreshCw, Wand2, DollarSign, TrendingUp,
} from "lucide-react";

export interface ProductForm {
  name: string; sku: string; description: string; price: string; original_price: string;
  category_id: string; sizes: string; colors: string; banho: string; pedra: string;
  material: string; weight_g: string; tags: string; tags_seo: string; priority: string;
  stock_quantity: string; is_featured: boolean; stock_status: boolean; internal_notes: string;
  foto_frontal: string; foto_lateral: string; foto_lifestyle: string; foto_detalhe: string;
  images: string[];
  // Custos & precificação
  cost_unit: string; cost_packaging: string; cost_shipping: string;
  cost_taxes: string; cost_fees: string;
  supplier_name: string; supplier_code: string; purchase_date: string;
}

export const emptyForm: ProductForm = {
  name: "", sku: "", description: "", price: "", original_price: "",
  category_id: "", sizes: "", colors: "", banho: "", pedra: "",
  material: "", weight_g: "", tags: "", tags_seo: "", priority: "Média",
  stock_quantity: "0", is_featured: false, stock_status: true,
  internal_notes: "", foto_frontal: "", foto_lateral: "",
  foto_lifestyle: "", foto_detalhe: "", images: [],
  cost_unit: "", cost_packaging: "", cost_shipping: "",
  cost_taxes: "", cost_fees: "",
  supplier_name: "", supplier_code: "", purchase_date: "",
};

interface SeoSuggestions {
  suggestedName: string;
  suggestedDescription: string;
  seoTags: string;
  qualityScore: number;
  improvements: string[];
  nameChanged: boolean;
}

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

  // AI SEO state
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoSuggestions, setSeoSuggestions] = useState<SeoSuggestions | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);

  // AI Photo state — per slot
  const [aiPhotoLoading, setAiPhotoLoading] = useState<Record<string, boolean>>({});

  const saveMutation = useMutation({
    mutationFn: async () => {
      const stockQty = parseInt(form.stock_quantity) || 0;
      const cu = parseFloat(form.cost_unit) || 0;
      const cp = parseFloat(form.cost_packaging) || 0;
      const cs = parseFloat(form.cost_shipping) || 0;
      const ct = parseFloat(form.cost_taxes) || 0;
      const cf = parseFloat(form.cost_fees) || 0;
      const costTotal = cu + cp + cs + ct + cf;
      const sellPrice = parseFloat(form.price) || 0;
      const profit = sellPrice - costTotal;
      const markup = costTotal > 0 ? (profit / costTotal) * 100 : 0;

      const payload = {
        name: form.name, sku: form.sku || null, description: form.description || null,
        price: sellPrice, original_price: parseFloat(form.original_price) || null,
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
        cost_unit: cu, cost_packaging: cp, cost_shipping: cs, cost_taxes: ct, cost_fees: cf,
        cost_total: costTotal, profit_amount: profit,
        markup_percent: Math.round(markup * 100) / 100,
        supplier_name: form.supplier_name || null,
        supplier_code: form.supplier_code || null,
        purchase_date: form.purchase_date || null,
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
    const updatedForm = { ...form };
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast.error(`Erro: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      if (slot) {
        (updatedForm as any)[slot] = urlData.publicUrl;
      } else {
        updatedForm.images = [...updatedForm.images, urlData.publicUrl];
      }
    }
    setForm(updatedForm);
    setUploading(false);
  };

  // AI: process a photo through the marketing AI (catalog/mockup/lifestyle)
  const handleAiPhoto = async (slot: string, imageUrl: string, style: "catalog" | "mockup" | "lifestyle") => {
    setAiPhotoLoading((prev) => ({ ...prev, [slot]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("process-product-photo", {
        body: {
          imageUrl,
          productName: form.name,
          banho: form.banho,
          pedra: form.pedra,
          material: form.material,
          style,
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setForm({ ...form, [slot]: data.image_url });
      toast.success("Foto tratada com IA!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao tratar foto com IA");
    } finally {
      setAiPhotoLoading((prev) => ({ ...prev, [slot]: false }));
    }
  };

  // AI: SEO optimization
  const handleAiSeo = async () => {
    if (!form.name) { toast.error("Preencha o nome do produto primeiro"); return; }
    setSeoLoading(true);
    setSeoOpen(false);
    setSeoSuggestions(null);
    try {
      const categoryName = categories?.find((c) => c.id === form.category_id)?.name || "";
      const { data, error } = await supabase.functions.invoke("ai-product-seo", {
        body: {
          name: form.name,
          description: form.description,
          category: categoryName,
          material: form.material,
          banho: form.banho,
          pedra: form.pedra,
          tags: form.tags,
          price: form.price,
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setSeoSuggestions(data as SeoSuggestions);
      setSeoOpen(true);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar sugestões SEO");
    } finally {
      setSeoLoading(false);
    }
  };

  const applySeo = (field: keyof ProductForm, value: string) => {
    setForm({ ...form, [field]: value });
    toast.success("Campo atualizado!");
  };

  const applyAllSeo = () => {
    if (!seoSuggestions) return;
    setForm({
      ...form,
      name: seoSuggestions.suggestedName,
      description: seoSuggestions.suggestedDescription,
      tags_seo: seoSuggestions.seoTags,
    });
    setSeoOpen(false);
    toast.success("Todas as sugestões aplicadas!");
  };

  const set = (key: keyof ProductForm, value: any) => setForm({ ...form, [key]: value });

  // Slot label → AI style mapping
  const slotStyleMap: Record<string, "catalog" | "mockup" | "lifestyle"> = {
    foto_frontal: "catalog",
    foto_lateral: "catalog",
    foto_lifestyle: "lifestyle",
    foto_detalhe: "catalog",
  };

  const FotoSlot = ({ label, field }: { label: string; field: keyof ProductForm }) => {
    const imgUrl = form[field] as string;
    const isLoading = aiPhotoLoading[field as string];
    const aiStyle = slotStyleMap[field as string] || "catalog";

    return (
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
        {imgUrl ? (
          <div className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-border">
            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-[10px] text-white">Tratando...</span>
              </div>
            )}
            {!isLoading && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end justify-center pb-2 gap-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleAiPhoto(field as string, imgUrl, aiStyle)}
                  className="flex items-center gap-1 bg-primary text-primary-foreground text-[9px] font-medium px-2 py-1 rounded-md"
                  title="Tratar com IA"
                >
                  <Wand2 className="h-2.5 w-2.5" />
                  IA
                </button>
                <button
                  type="button"
                  onClick={() => set(field, "")}
                  className="bg-destructive text-destructive-foreground text-[9px] px-2 py-1 rounded-md"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center aspect-[3/4] rounded-lg border border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-secondary/20">
            <ImageIcon className="h-5 w-5 text-muted-foreground/40 mb-1" />
            <span className="text-[10px] text-muted-foreground">Upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, field as string)} disabled={uploading} />
          </label>
        )}
      </div>
    );
  };

  const scoreColor = seoSuggestions
    ? seoSuggestions.qualityScore >= 70 ? "text-emerald-400" : seoSuggestions.qualityScore >= 40 ? "text-amber-400" : "text-red-400"
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-card border-border">
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
              {/* TAB: Geral */}
              <TabsContent value="info" className="mt-0 space-y-4">
                {/* Name with AI SEO button */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome *</Label>
                      <button
                        type="button"
                        onClick={handleAiSeo}
                        disabled={seoLoading || !form.name}
                        className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 disabled:opacity-40 transition-colors font-medium"
                      >
                        {seoLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                        {seoLoading ? "Analisando..." : "Otimizar SEO"}
                      </button>
                    </div>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="admin-input" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">SKU</Label>
                    <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="admin-input" placeholder="BR-001" />
                  </div>
                </div>

                {/* SEO Suggestions Panel */}
                {seoOpen && seoSuggestions && (
                  <div className="border border-primary/20 rounded-xl bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary">Sugestões de SEO</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${scoreColor}`}>
                          Score original: {seoSuggestions.qualityScore}/100
                        </span>
                        <button type="button" onClick={() => setSeoOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">×</button>
                      </div>
                    </div>

                    {/* Improvements */}
                    {seoSuggestions.improvements.length > 0 && (
                      <ul className="space-y-0.5">
                        {seoSuggestions.improvements.map((imp, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                            <CheckCircle2 className="h-2.5 w-2.5 text-primary mt-0.5 shrink-0" />
                            {imp}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Suggested Name */}
                    {seoSuggestions.nameChanged && (
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Nome sugerido</Label>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-xs bg-secondary/50 rounded-md px-2 py-1.5">{seoSuggestions.suggestedName}</p>
                          <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] shrink-0" onClick={() => applySeo("name", seoSuggestions.suggestedName)}>Usar</Button>
                        </div>
                      </div>
                    )}

                    {/* Suggested Description */}
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Descrição sugerida</Label>
                      <div className="space-y-1.5">
                        <p className="text-xs bg-secondary/50 rounded-md px-2 py-1.5 leading-relaxed">{seoSuggestions.suggestedDescription}</p>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => applySeo("description", seoSuggestions.suggestedDescription)}>Usar descrição</Button>
                      </div>
                    </div>

                    {/* Suggested SEO Tags */}
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Tags SEO sugeridas</Label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-[10px] bg-secondary/50 rounded-md px-2 py-1.5 text-muted-foreground">{seoSuggestions.seoTags}</p>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] shrink-0" onClick={() => applySeo("tags_seo", seoSuggestions.seoTags)}>Usar</Button>
                      </div>
                    </div>

                    <Button type="button" size="sm" className="w-full h-8 gap-1.5" onClick={applyAllSeo}>
                      <CheckCircle2 className="h-3 w-3" />
                      Aplicar todas as sugestões
                    </Button>
                  </div>
                )}

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

              {/* TAB: Mídia */}
              <TabsContent value="media" className="mt-0 space-y-4">
                {/* AI Photo Info Banner */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
                  <Wand2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Após enviar uma foto, passe o mouse sobre ela e clique em <strong className="text-primary">IA</strong> para gerar automaticamente uma versão profissional com fundo limpo, iluminação e identidade visual da marca.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Fotos do Produto</Label>
                  <div className="grid grid-cols-4 gap-3">
                    <FotoSlot label="Frontal" field="foto_frontal" />
                    <FotoSlot label="Lateral" field="foto_lateral" />
                    <FotoSlot label="Lifestyle" field="foto_lifestyle" />
                    <FotoSlot label="Detalhe" field="foto_detalhe" />
                  </div>
                </div>

                {/* Batch AI processing */}
                {(form.foto_frontal || form.foto_lateral || form.foto_lifestyle || form.foto_detalhe) && (
                  <div className="flex gap-2 flex-wrap">
                    {(["foto_frontal", "foto_lateral", "foto_detalhe"] as const).every((f) => form[f]) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                        disabled={Object.values(aiPhotoLoading).some(Boolean)}
                        onClick={async () => {
                          const slots = [
                            { key: "foto_frontal", style: "catalog" as const },
                            { key: "foto_lateral", style: "catalog" as const },
                            { key: "foto_detalhe", style: "catalog" as const },
                          ].filter(({ key }) => !!(form as any)[key]);
                          for (const { key, style } of slots) {
                            await handleAiPhoto(key, (form as any)[key], style);
                          }
                        }}
                      >
                        <Wand2 className="h-2.5 w-2.5" />
                        Tratar todas com IA
                      </Button>
                    )}
                  </div>
                )}

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

              {/* TAB: Detalhes */}
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

              {/* TAB: SEO & Notas */}
              <TabsContent value="seo" className="mt-0 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tags SEO</Label>
                    <button
                      type="button"
                      onClick={handleAiSeo}
                      disabled={seoLoading || !form.name}
                      className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 disabled:opacity-40 transition-colors font-medium"
                    >
                      {seoLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                      Gerar com IA
                    </button>
                  </div>
                  <Input value={form.tags_seo} onChange={(e) => set("tags_seo", e.target.value)} className="admin-input" placeholder="brinco folheado ouro 18k" />
                </div>

                {/* SEO quality indicator */}
                {form.tags_seo && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    SEO configurado
                  </div>
                )}
                {!form.tags_seo && form.name && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                    <RefreshCw className="h-3 w-3" />
                    Sem tags SEO — clique em "Gerar com IA" para otimizar
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observação Interna</Label>
                  <Textarea value={form.internal_notes} onChange={(e) => set("internal_notes", e.target.value)} className="admin-input min-h-[100px] resize-none" placeholder="Notas visíveis apenas no admin..." />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
              {/* Completeness indicator */}
              {form.name && form.price && (
                <div className="flex items-center gap-1.5">
                  {[
                    { ok: !!form.description, label: "Desc" },
                    { ok: !!(form.foto_frontal || form.images.length), label: "Foto" },
                    { ok: !!form.tags_seo, label: "SEO" },
                    { ok: !!form.category_id, label: "Cat" },
                  ].map(({ ok, label }) => (
                    <Badge key={label} variant="outline" className={`text-[9px] h-4 px-1 ${ok ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary text-muted-foreground"}`}>
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" size="sm" disabled={saveMutation.isPending || !form.name || !form.price}>
              {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
