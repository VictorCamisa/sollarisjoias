import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import ProductCard from "@/components/store/ProductCard";
import { useSearchProducts } from "@/hooks/useStore";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useSearchProducts(query);

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-3xl font-serif font-semibold mb-8 text-center">Buscar</h1>
          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="pl-12 h-12 rounded-xl text-base"
            />
          </div>
        </motion.div>

        {query.length >= 2 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results && results.length > 0
              ? results.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    image={p.images?.[0]}
                    category={(p.categories as any)?.name}
                    index={i}
                  />
                ))
              : !isLoading && (
                  <div className="col-span-full text-center text-muted-foreground py-12">
                    <p>Nenhum produto encontrado para "{query}".</p>
                  </div>
                )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
