import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useStore";
import { motion } from "framer-motion";

// fallback se categorias não vierem do banco
const fallbackCategories = [
  { name: "Anéis", slug: "aneis" },
  { name: "Colares", slug: "colares" },
  { name: "Brincos", slug: "brincos" },
  { name: "Pulseiras", slug: "pulseiras" },
  { name: "Choker", slug: "choker" },
  { name: "Tornozeleiras", slug: "tornozeleiras" },
];

const CategoryStrip = () => {
  const { data, isLoading } = useCategories();
  const categories = (data && data.length > 0 ? data : fallbackCategories) as { name: string; slug: string }[];

  return (
    <section className="bg-card border-y border-border">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-6 sm:py-7">
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
            Categorias
          </p>
          <Link
            to="/colecao"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-bordeaux hover:underline"
          >
            Ver tudo →
          </Link>
        </div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
          {(isLoading ? fallbackCategories : categories).map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <Link
                to={`/colecao?cat=${cat.slug}`}
                className="inline-flex items-center font-mono text-[11px] uppercase tracking-[0.22em] px-5 py-2.5 border border-border bg-background hover:bg-bordeaux hover:text-maison-creme hover:border-bordeaux transition-all duration-300 whitespace-nowrap"
              >
                {cat.name}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryStrip;
