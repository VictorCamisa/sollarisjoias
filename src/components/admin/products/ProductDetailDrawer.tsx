import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Package, Tag, Gem, Weight, Layers, TrendingUp, Calendar, Building2 } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface ProductDetailDrawerProps {
  product: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (p: any) => void;
  onDelete: (id: string) => void;
}

export const ProductDetailDrawer = ({ product, open, onOpenChange, onEdit, onDelete }: ProductDetailDrawerProps) => {
  if (!product) return null;

  const allImages = [
    product.foto_frontal,
    product.foto_lateral,
    product.foto_lifestyle,
    product.foto_detalhe,
    ...(product.images || []),
  ].filter(Boolean);

  const attrs = [
    { label: "Material", value: product.material, icon: Gem },
    { label: "Banho", value: product.banho, icon: Layers },
    { label: "Pedra", value: product.pedra, icon: Gem },
    { label: "Peso", value: product.weight_g ? `${product.weight_g}g` : null, icon: Weight },
    { label: "SKU", value: product.sku, icon: Tag },
  ].filter((a) => a.value);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base font-semibold">{product.name}</SheetTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {product.is_featured && (
              <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">⭐ Destaque</Badge>
            )}
            <Badge className={`text-[10px] border ${(product.stock_quantity ?? 0) === 0 ? "bg-red-500/10 text-red-400 border-red-500/20" : (product.stock_quantity ?? 0) < 5 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
              {(product.stock_quantity ?? 0) === 0 ? "Esgotado" : `${product.stock_quantity} em estoque`}
            </Badge>
            {product.priority === "Alta" && (
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">🔥 Alta Prioridade</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Images */}
          {allImages.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fotos ({allImages.length})</h3>
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((img: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-secondary border border-border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preço</h3>
            <div className="flex items-baseline gap-3 bg-secondary/30 rounded-lg p-4">
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-muted-foreground line-through">{fmt(product.original_price)}</span>
              )}
              <span className="text-2xl font-bold text-primary tabular-nums">{fmt(product.price)}</span>
              {product.original_price && product.original_price > product.price && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                  -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Attributes */}
          {attrs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Atributos</h3>
              <div className="grid grid-cols-2 gap-2">
                {attrs.map((attr) => (
                  <div key={attr.label} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30">
                    <attr.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{attr.label}</p>
                      <p className="text-xs font-medium">{attr.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sizes & Colors */}
          {((product.sizes?.length > 0) || (product.colors?.length > 0)) && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Variações</h3>
              {product.sizes?.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Tamanhos</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {product.sizes.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 text-[10px] bg-secondary/50 border border-border rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {product.colors?.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Cores</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {product.colors.map((c: string) => (
                      <span key={c} className="px-2 py-0.5 text-[10px] bg-secondary/50 border border-border rounded-md">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</h3>
              <div className="flex gap-1.5 flex-wrap">
                {product.tags.map((t: string) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          {product.internal_notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nota Interna</h3>
              <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">{product.internal_notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => { onEdit(product); onOpenChange(false); }}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => { if (confirm("Excluir este produto?")) { onDelete(product.id); onOpenChange(false); } }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
