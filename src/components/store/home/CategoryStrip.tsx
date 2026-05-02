import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

// Ordem editorial fixa (categorias âncora primeiro)
const ORDER = ["aneis", "brincos", "colares", "choker", "pulseiras", "tornozeleiras"];

interface CategoryCard {
  slug: string;
  name: string;
  image: string | null;
  count: number;
}

const useCategoriesWithImages = () =>
  useQuery({
    queryKey: ["categories-with-images"],
    queryFn: async (): Promise<CategoryCard[]> => {
      const { data: cats } = await supabase.from("categories").select("id, slug, name");
      if (!cats) return [];
      const { data: prods } = await supabase
        .from("products")
        .select("category_id, foto_frontal, images")
        .eq("stock_status", true)
        .gt("stock_quantity", 0);
      const byCat = new Map<string, { image: string | null; count: number }>();
      (prods || []).forEach((p: any) => {
        const cur = byCat.get(p.category_id) || { image: null, count: 0 };
        cur.count += 1;
        if (!cur.image) cur.image = p.foto_frontal || p.images?.[0] || null;
        byCat.set(p.category_id, cur);
      });
      const list = cats.map((c: any) => ({
        slug: c.slug,
        name: c.name,
        image: byCat.get(c.id)?.image ?? null,
        count: byCat.get(c.id)?.count ?? 0,
      }));
      return list.sort(
        (a, b) => (ORDER.indexOf(a.slug) === -1 ? 99 : ORDER.indexOf(a.slug)) -
                  (ORDER.indexOf(b.slug) === -1 ? 99 : ORDER.indexOf(b.slug))
      );
    },
    staleTime: 5 * 60 * 1000,
  });

const CategoryStrip = () => {
  const { data: categories = [], isLoading } = useCategoriesWithImages();

  return (
    <section className="bg-background">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 pt-14 sm:pt-20 pb-10 sm:pb-14">
        <div className="flex items-end justify-between gap-4 mb-7 sm:mb-10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bordeaux mb-2">
              Categorias
            </p>
            <h2 className="font-display text-[26px] sm:text-[40px] leading-[1.05] text-foreground">
              Encontre seu ritual
            </h2>
          </div>
          <Link
            to="/colecao"
            className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-bordeaux transition-colors pb-2"
          >
            Ver tudo →
          </Link>
        </div>

        {/* Carrossel horizontal premium */}
        <div className="-mx-6 sm:-mx-10 px-6 sm:px-10 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 sm:gap-5 pb-2">
            {(isLoading ? Array(6).fill(null) : categories).map((cat: CategoryCard | null, i: number) => (
              <motion.div
                key={cat?.slug || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="flex-shrink-0"
              >
                {cat ? (
                  <Link
                    to={`/colecao?cat=${cat.slug}`}
                    className="group block relative w-[170px] sm:w-[230px] aspect-[3/4] overflow-hidden bg-card border border-border/40 hover:border-bordeaux/50 transition-all duration-500"
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-card to-bordeaux/10 flex items-center justify-center">
                        <span className="font-display text-bordeaux/30 text-4xl">{cat.name[0]}</span>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    {/* Label */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-white/60 mb-1">
                        {cat.count > 0 ? `${cat.count} peças` : "Em breve"}
                      </p>
                      <h3 className="font-display text-white text-[18px] sm:text-[22px] leading-tight">
                        {cat.name}
                      </h3>
                    </div>
                    {/* Hover line */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bordeaux to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                  </Link>
                ) : (
                  <div className="w-[170px] sm:w-[230px] aspect-[3/4] bg-card border border-border/40 animate-pulse" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link
            to="/colecao"
            className="inline-flex font-mono text-[10px] uppercase tracking-[0.28em] text-bordeaux"
          >
            Ver tudo →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryStrip;
