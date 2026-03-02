import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, FolderOpen, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const { data: productCount } = useQuery({
    queryKey: ["admin-product-count"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: categoryCount } = useQuery({
    queryKey: ["admin-category-count"],
    queryFn: async () => {
      const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const stats = [
    { label: "Produtos", value: productCount ?? 0, icon: Package },
    { label: "Categorias", value: categoryCount ?? 0, icon: FolderOpen },
    { label: "Cliques WhatsApp", value: "—", icon: MessageCircle },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif font-semibold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-3xl font-semibold">{stat.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
