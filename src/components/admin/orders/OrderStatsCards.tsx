import { ShoppingCart, Clock, CheckCircle2, TrendingUp, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  revenue: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const OrderStatsCards = ({ stats }: { stats: OrderStats }) => {
  const cards = [
    {
      label: "Total de Pedidos",
      value: stats.total,
      icon: ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pendentes",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Confirmados",
      value: stats.confirmed,
      icon: CheckCircle2,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Entregues",
      value: stats.delivered,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Receita Total",
      value: fmt(stats.revenue),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      isText: true,
    },
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
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              {card.label}
            </span>
            <div className={`${card.bg} ${card.color} p-1.5 rounded-lg`}>
              <card.icon className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold tabular-nums">
            {card.isText ? card.value : card.value}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
