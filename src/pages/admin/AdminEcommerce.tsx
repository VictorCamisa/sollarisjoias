import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Globe, Star, Package, ImageIcon, Search, AlertTriangle,
  CheckCircle2, ExternalLink, Wand2, Loader2, RefreshCw,
  LayoutGrid, Eye, TrendingUp, ShoppingCart, FolderOpen,
  ArrowUpRight, Sparkles, Image, ShieldCheck,
} from "lucide-react";

/* ─── helpers ─── */
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function StoreHealthBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

/* ─── sub-components ─── */
function StatCard({ label, value, icon: Icon, color, to, detail }: any) {
  const inner = (
    <div className="admin-card p-3 flex items-center gap-3 group">
      <div className={`admin-kpi-icon ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="admin-kpi-value">{value}</p>
        <p className="admin-kpi-label">{label}</p>
      </div>
      {detail && <span className="text-[10px] text-muted-foreground">{detail}</span>}
      {to && <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

/* ════════════════════════════════════════════════════════ */
/*  PAGE                                                     */
/* ════════════════════════════════════════════════════════ */
const AdminEcommerce = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("painel");
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [seoSearch, setSeoSearch] = useState("");
  const [photoSearch, setPhotoSearch] = useState("");

  /* ─── data ─── */
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["ecommerce-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, price, is_featured, foto_frontal, foto_lateral, foto_lifestyle, foto_detalhe, images, tags_seo, description, category_id, stock_status, stock_quantity, banho, pedra, material")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ordersThisMonth = 0 } = useQuery({
    queryKey: ["ecommerce-orders-month"],
    queryFn: async () => {
      const start = new Date();
      start.setDate(1); start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString());
      return count ?? 0;
    },
  });

  /* ─── toggle featured ─── */
  const toggleFeatured = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("products").update({ is_featured: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  /* ─── AI photo for a product ─── */
  const handleAiPhoto = async (productId: string, imageUrl: string) => {
    setAiLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const product = products.find((p) => p.id === productId);
      const { data, error } = await supabase.functions.invoke("process-product-photo", {
        body: {
          imageUrl,
          productName: product?.name ?? "",
          banho: product?.banho ?? "",
          pedra: product?.pedra ?? "",
          material: product?.material ?? "",
          style: "catalog",
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      const { error: upErr } = await supabase
        .from("products")
        .update({ foto_frontal: data.image_url })
        .eq("id", productId);
      if (upErr) throw upErr;
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      toast.success("Foto tratada com IA e salva!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao tratar foto com IA");
    } finally {
      setAiLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  /* ─── derived stats ─── */
  const stats = useMemo(() => {
    const total = products.length;
    const featured = products.filter((p) => p.is_featured).length;
    const withFoto = products.filter((p) => p.foto_frontal || (p.images?.length ?? 0) > 0).length;
    const withSeo = products.filter((p) => p.tags_seo).length;
    const withDesc = products.filter((p) => p.description).length;
    const active = products.filter((p) => p.stock_status).length;

    const photoScore = total > 0 ? Math.round((withFoto / total) * 100) : 0;
    const seoScore = total > 0 ? Math.round((withSeo / total) * 100) : 0;
    const descScore = total > 0 ? Math.round((withDesc / total) * 100) : 0;
    const overallHealth = Math.round((photoScore + seoScore + descScore) / 3);

    return { total, featured, withFoto, withSeo, withDesc, active, photoScore, seoScore, descScore, overallHealth };
  }, [products]);

  /* ─── filtered lists ─── */
  const noSeoProducts = useMemo(
    () => products.filter((p) => !p.tags_seo && (!seoSearch || p.name.toLowerCase().includes(seoSearch.toLowerCase()))),
    [products, seoSearch],
  );

  const noPhotoProducts = useMemo(
    () => products.filter((p) => !p.foto_frontal && (!photoSearch || p.name.toLowerCase().includes(photoSearch.toLowerCase()))),
    [products, photoSearch],
  );

  const featuredProducts = useMemo(() => products.filter((p) => p.is_featured), [products]);
  const allForVitrine = useMemo(
    () => [...products].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)),
    [products],
  );

  /* ─── render ─── */
  return (
    <div className="space-y-4 max-w-[1280px]">
      {/* ── header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Ecommerce</h1>
          <p className="admin-page-subtitle">Gestão completa da loja online</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-medium border border-border px-3 py-1.5 rounded-md hover:bg-secondary/60 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            Ver Loja
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
          </a>
          <Link
            to="/admin/produtos"
            className="flex items-center gap-1.5 text-[11px] font-medium bg-accent/10 border border-accent/20 text-accent px-3 py-1.5 rounded-md hover:bg-accent/15 transition-colors"
          >
            <Package className="h-3.5 w-3.5" />
            Gerenciar Produtos
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/30 h-9">
          <TabsTrigger value="painel" className="text-xs gap-1.5 h-8">
            <LayoutGrid className="h-3 w-3" />Painel
          </TabsTrigger>
          <TabsTrigger value="vitrine" className="text-xs gap-1.5 h-8">
            <Star className="h-3 w-3" />Vitrine
          </TabsTrigger>
          <TabsTrigger value="fotos" className="text-xs gap-1.5 h-8">
            <Image className="h-3 w-3" />
            Fotos IA
            {noPhotoProducts.length > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[9px] ml-0.5">{noPhotoProducts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-xs gap-1.5 h-8">
            <ShieldCheck className="h-3 w-3" />
            SEO
            {noSeoProducts.length > 0 && (
              <Badge variant="outline" className="h-4 px-1 text-[9px] ml-0.5 border-amber-500/50 text-amber-400">{noSeoProducts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ════ PAINEL ════ */}
        <TabsContent value="painel" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard label="Produtos ativos" value={stats.active} icon={Package} color="bg-accent/10 text-accent" to="/admin/produtos" />
            <StatCard label="Em destaque" value={stats.featured} icon={Star} color="bg-amber-500/10 text-amber-400" />
            <StatCard label="Categorias" value={categories.length} icon={FolderOpen} color="bg-blue-500/10 text-blue-400" to="/admin/categorias" />
            <StatCard label="Pedidos este mês" value={ordersThisMonth} icon={ShoppingCart} color="bg-emerald-500/10 text-emerald-500" to="/admin/pedidos" />
          </div>

          {/* Health score */}
          <div className="admin-card p-4 space-y-4">
            <div className="admin-card-header">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-accent" />
                <h2 className="admin-card-title">Saúde da Loja</h2>
              </div>
              <span className={`text-base font-bold tabular-nums ${stats.overallHealth >= 80 ? "text-emerald-400" : stats.overallHealth >= 50 ? "text-amber-400" : "text-red-400"}`}>
                {stats.overallHealth}%
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Cobertura de fotos", score: stats.photoScore, count: stats.withFoto, total: stats.total, tab: "fotos", icon: ImageIcon },
                { label: "Tags SEO", score: stats.seoScore, count: stats.withSeo, total: stats.total, tab: "seo", icon: Search },
                { label: "Descrições", score: stats.descScore, count: stats.withDesc, total: stats.total, tab: "painel", icon: TrendingUp },
              ].map(({ label, score, count, total, tab, icon: Icon }) => (
                <button
                  key={label}
                  className="text-left space-y-2 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  onClick={() => setActiveTab(tab)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] font-medium">{label}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"}`}>{score}%</span>
                  </div>
                  <StoreHealthBar score={score} />
                  <p className="text-[10px] text-muted-foreground">{count} de {total} produtos</p>
                </button>
              ))}
            </div>
          </div>

          {/* Featured preview */}
          <div className="admin-card p-4">
            <div className="admin-card-header mb-3">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <h2 className="admin-card-title">Produtos em Destaque</h2>
              </div>
              <button
                onClick={() => setActiveTab("vitrine")}
                className="text-[10px] text-accent hover:text-accent/80 transition-colors"
              >
                Gerenciar →
              </button>
            </div>
            {featuredProducts.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-center">
                <Star className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-[11px] text-muted-foreground">Nenhum produto em destaque na vitrine</p>
                <Button size="sm" variant="outline" className="h-7 text-[10px] mt-1" onClick={() => setActiveTab("vitrine")}>
                  Configurar vitrine
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {featuredProducts.slice(0, 8).map((p) => (
                  <div key={p.id} className="space-y-1">
                    <div className="aspect-square rounded-md overflow-hidden bg-secondary/30 border border-border relative">
                      {p.foto_frontal ? (
                        <img src={p.foto_frontal} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute top-0.5 right-0.5">
                        <span className="h-3.5 w-3.5 rounded-full bg-amber-400/90 flex items-center justify-center">
                          <Star className="h-2 w-2 text-amber-900" fill="currentColor" />
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground truncate">{p.name}</p>
                  </div>
                ))}
                {featuredProducts.length > 8 && (
                  <button
                    onClick={() => setActiveTab("vitrine")}
                    className="aspect-square rounded-md border border-dashed border-border flex items-center justify-center text-[9px] text-muted-foreground hover:border-accent/40 transition-colors"
                  >
                    +{featuredProducts.length - 8}
                  </button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════ VITRINE ════ */}
        <TabsContent value="vitrine" className="mt-4">
          <div className="admin-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="admin-card-title">Vitrine Principal</h2>
                <p className="admin-card-subtitle mt-0.5">
                  {stats.featured} produto{stats.featured !== 1 ? "s" : ""} em destaque na homepage
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Destaque ativo na loja
              </div>
            </div>

            {productsLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allForVitrine.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary/30 border border-border flex-shrink-0">
                      {p.foto_frontal ? (
                        <img src={p.foto_frontal} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-3.5 w-3.5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.sku && <span className="text-[9px] font-mono text-muted-foreground">{p.sku}</span>}
                        <span className="text-[10px] font-semibold text-accent tabular-nums">{fmt(p.price)}</span>
                        {!p.stock_status && (
                          <Badge variant="destructive" className="h-3.5 px-1 text-[8px]">Esgotado</Badge>
                        )}
                      </div>
                    </div>

                    {/* Photo indicator */}
                    <div className="flex-shrink-0">
                      {p.foto_frontal ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                      )}
                    </div>

                    {/* Featured toggle */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.is_featured && (
                        <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
                      )}
                      <Switch
                        checked={p.is_featured}
                        onCheckedChange={(v) => toggleFeatured.mutate({ id: p.id, value: v })}
                        className="scale-75"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════ FOTOS IA ════ */}
        <TabsContent value="fotos" className="mt-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15">
            <Wand2 className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-violet-300">Tratamento de fotos com IA</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Produtos sem foto profissional. Faça upload de uma foto amadora no cadastro do produto e use o botão <strong className="text-violet-300">IA</strong> para gerar automaticamente uma versão com fundo obsidiana, iluminação de luxo e padrão premium de e-commerce.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={photoSearch}
              onChange={(e) => setPhotoSearch(e.target.value)}
              placeholder="Filtrar produtos sem foto..."
              className="admin-input pl-8 h-9 text-sm w-full"
            />
          </div>

          {noPhotoProducts.length === 0 ? (
            <div className="admin-card p-10 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400/40" />
              <div>
                <p className="text-sm font-medium">Todos os produtos têm foto!</p>
                <p className="text-[11px] text-muted-foreground mt-1">Cobertura de fotos 100%</p>
              </div>
            </div>
          ) : (
            <div className="admin-card divide-y divide-border">
              <div className="px-4 py-2 flex items-center justify-between border-b border-border bg-secondary/20">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {noPhotoProducts.length} produto{noPhotoProducts.length !== 1 ? "s" : ""} sem foto frontal
                </span>
                <Link to="/admin/produtos" className="text-[10px] text-accent hover:text-accent/80 transition-colors">
                  Cadastrar fotos →
                </Link>
              </div>
              {noPhotoProducts.map((p) => {
                const hasAnyPhoto = (p.images?.length ?? 0) > 0 || p.foto_lateral || p.foto_lifestyle || p.foto_detalhe;
                const sourcePhoto = p.foto_lateral || p.foto_lifestyle || p.foto_detalhe || p.images?.[0];
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-secondary/30 border border-border flex-shrink-0 relative">
                      {sourcePhoto ? (
                        <img src={sourcePhoto} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.sku && <span className="text-[9px] font-mono text-muted-foreground">{p.sku}</span>}
                        <span className="text-[10px] text-accent tabular-nums font-semibold">{fmt(p.price)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasAnyPhoto ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1 border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                          disabled={aiLoading[p.id]}
                          onClick={() => handleAiPhoto(p.id, sourcePhoto!)}
                        >
                          {aiLoading[p.id] ? (
                            <><Loader2 className="h-2.5 w-2.5 animate-spin" />Processando...</>
                          ) : (
                            <><Wand2 className="h-2.5 w-2.5" />Gerar foto frontal com IA</>
                          )}
                        </Button>
                      ) : (
                        <Link
                          to="/admin/produtos"
                          className="flex items-center gap-1 h-7 text-[10px] border border-border px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                        >
                          <ImageIcon className="h-2.5 w-2.5" />
                          Upload foto
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ════ SEO ════ */}
        <TabsContent value="seo" className="mt-4 space-y-3">
          {/* SEO health summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {[
              {
                label: "Tags SEO",
                count: stats.withSeo,
                total: stats.total,
                score: stats.seoScore,
                icon: Sparkles,
                color: "text-violet-400 bg-violet-500/10",
              },
              {
                label: "Descrições",
                count: stats.withDesc,
                total: stats.total,
                score: stats.descScore,
                icon: Search,
                color: "text-blue-400 bg-blue-500/10",
              },
              {
                label: "Saúde SEO geral",
                count: Math.round((stats.seoScore + stats.descScore) / 2),
                total: 100,
                score: Math.round((stats.seoScore + stats.descScore) / 2),
                icon: ShieldCheck,
                color: "text-emerald-400 bg-emerald-500/10",
                isPercent: true,
              },
            ].map(({ label, count, total, score, icon: Icon, color, isPercent }: any) => (
              <div key={label} className="admin-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-md flex items-center justify-center ${color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-medium">{label}</span>
                  <span className={`ml-auto text-sm font-bold ${score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                    {isPercent ? `${count}%` : `${count}/${total}`}
                  </span>
                </div>
                <StoreHealthBar score={score} />
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={seoSearch}
              onChange={(e) => setSeoSearch(e.target.value)}
              placeholder="Filtrar produtos sem SEO..."
              className="admin-input pl-8 h-9 text-sm w-full"
            />
          </div>

          {noSeoProducts.length === 0 ? (
            <div className="admin-card p-10 flex flex-col items-center gap-3 text-center">
              <ShieldCheck className="h-10 w-10 text-emerald-400/40" />
              <div>
                <p className="text-sm font-medium">SEO completo em todos os produtos!</p>
                <p className="text-[11px] text-muted-foreground mt-1">Todos os produtos têm tags SEO configuradas</p>
              </div>
            </div>
          ) : (
            <div className="admin-card">
              <div className="px-4 py-2 border-b border-border bg-secondary/20 flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {noSeoProducts.length} produto{noSeoProducts.length !== 1 ? "s" : ""} sem tags SEO
                </span>
                <Link to="/admin/produtos" className="text-[10px] text-accent hover:text-accent/80 transition-colors">
                  Abrir no catálogo →
                </Link>
              </div>
              <div className="divide-y divide-border">
                {noSeoProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20 transition-colors">
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary/30 border border-border flex-shrink-0">
                      {p.foto_frontal ? (
                        <img src={p.foto_frontal} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-3.5 w-3.5 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.sku && <span className="text-[9px] font-mono text-muted-foreground">{p.sku}</span>}
                        <div className="flex items-center gap-1">
                          {!p.tags_seo && (
                            <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                              <AlertTriangle className="h-2.5 w-2.5" />Sem tags SEO
                            </span>
                          )}
                          {!p.description && (
                            <span className="flex items-center gap-0.5 text-[9px] text-orange-400 ml-2">
                              <AlertTriangle className="h-2.5 w-2.5" />Sem descrição
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/admin/produtos"
                      className="flex items-center gap-1 text-[10px] border border-border px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex-shrink-0"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Otimizar
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEcommerce;
