import { Package, AlertTriangle, Star, TrendingUp, Camera, Tag, Percent, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface ProductStats {
  total: number;
  outOfStock: number;
  lowStock: number;
  featured: number;
  totalValue: number;
  withPhotos: number;
  withoutSeo: number;
  avgPrice: number;
  withDiscount: number;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (part: number, total: number) => total ? Math.round((part / total) * 100) : 0;

export const ProductStatsCards = ({ stats }: { stats: ProductStats }) => {
  const photoCoverage = pct(stats.withPhotos, stats.total);
  const seoCoverage = pct(stats.total - stats.withoutSeo, stats.total);

  const cards = [
    {
      label: "Total Produtos",
      value: stats.total,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
      sub: `${stats.featured} em destaque`,
    },
    {
      label: "Cobertura de Fotos",
      value: `${photoCoverage}%`,
      icon: Camera,
      color: photoCoverage >= 80 ? "text-emerald-400" : photoCoverage >= 50 ? "text-amber-400" : "text-red-400",
      bg: photoCoverage >= 80 ? "bg-emerald-400/10" : photoCoverage >= 50 ? "bg-amber-400/10" : "bg-red-400/10",
      sub: `${stats.total - stats.withPhotos} sem foto`,
      isText: true,
    },
    {
      label: "Ticket Médio",
      value: fmt(stats.avgPrice),
      icon: BarChart3,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      sub: `${stats.withDiscount} com desconto`,
      isText: true,
    },
    {
      label: "Otimização SEO",
      value: `${seoCoverage}%`,
      icon: Tag,
      color: seoCoverage >= 80 ? "text-emerald-400" : seoCoverage >= 50 ? "text-amber-400" : "text-red-400",
      bg: seoCoverage >= 80 ? "bg-emerald-400/10" : seoCoverage >= 50 ? "bg-amber-400/10" : "bg-red-400/10",
      sub: `${stats.withoutSeo} sem tags SEO`,
      isText: true,
    },
    {
      label: "Estoque Crítico",
      value: stats.outOfStock + stats.lowStock,
      icon: AlertTriangle,
      color: stats.outOfStock > 0 ? "text-red-400" : stats.lowStock > 0 ? "text-orange-400" : "text-emerald-400",
      bg: stats.outOfStock > 0 ? "bg-red-400/10" : stats.lowStock > 0 ? "bg-orange-400/10" : "bg-emerald-400/10",
      sub: `${stats.outOfStock} esgotados · ${stats.lowStock} baixos`,
    },
    {
      label: "Valor em Estoque",
      value: fmt(stats.totalValue),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      sub: "preço × quantidade",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="admin-card p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">{card.label}</span>
            <div className={`${card.bg} ${card.color} p-1.5 rounded-lg shrink-0`}>
              <card.icon className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="text-lg font-bold tabular-nums leading-none">{card.value}</span>
          {card.sub && (
            <span className="text-[10px] text-muted-foreground leading-none">{card.sub}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
};
