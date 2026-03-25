import { Package, AlertTriangle, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface ProductStats {
  total: number;
  outOfStock: number;
  lowStock: number;
  featured: number;
  totalValue: number;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const ProductStatsCards = ({ stats }: { stats: ProductStats }) => {
  const cards = [
    { label: "Total Produtos", value: stats.total, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "Em Destaque", value: stats.featured, icon: Star, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Estoque Baixo", value: stats.lowStock, icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Esgotados", value: stats.outOfStock, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "Valor em Estoque", value: fmt(stats.totalValue), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", isText: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="admin-card p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
            <div className={`${card.bg} ${card.color} p-1.5 rounded-lg`}>
              <card.icon className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold tabular-nums">{card.isText ? card.value : card.value}</span>
        </motion.div>
      ))}
    </div>
  );
};
