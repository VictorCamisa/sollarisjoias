import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/store/ProductCard";
import { Search } from "lucide-react";

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = params.get("q")?.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    const run = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, original_price, foto_frontal, images, stock_quantity, created_at, banho, material, pedra, categories(name)")
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,tags_seo.ilike.%${q}%,banho.ilike.%${q}%,material.ilike.%${q}%,pedra.ilike.%${q}%`)
        .limit(60);
      setResults(data ?? []);
      setLoading(false);
    };
    void run();
  }, [params]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setParams({ q: query.trim() });
    else setParams({});
  };

  return (
    <div className="bg-background min-h-screen pt-32 pb-20">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <nav className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50 mb-8">
          <Link to="/" className="hover:text-bordeaux">Início</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground/70">Busca</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-8">
          Buscar peças
        </h1>

        <form onSubmit={handleSubmit} className="relative mb-12 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" strokeWidth={1.4} />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Anel, ouro, esmeralda, banho 18k…"
            className="w-full bg-card border border-border pl-12 pr-4 py-3.5 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-bordeaux text-sm"
          />
        </form>

        {!params.get("q") ? (
          <p className="font-sans text-foreground/60 text-sm">Digite o nome de uma peça, material, banho ou pedra.</p>
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="font-sans text-foreground/60 text-sm">Nenhuma peça encontrada para "{params.get("q")}".</p>
        ) : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/60 mb-6">
              {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {results.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={Number(p.price)}
                  originalPrice={p.original_price ? Number(p.original_price) : null}
                  image={p.foto_frontal || p.images?.[0] || null}
                  category={p.categories?.name}
                  stockQuantity={p.stock_quantity}
                  createdAt={p.created_at}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
