import { ShoppingCart, Clock, CheckCircle2, TrendingUp, XCircle, Package } from "lucide-react";
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
      sub: `${stats.confirmed} confirmados`,
    },
    {
      label: "Pendentes",
      value: stats.pending,
      icon: Clock,
      color: stats.pending > 0 ? "text-amber-400" : "text-muted-foreground",
      bg: stats.pending > 0 ? "bg-amber-400/10" : "bg-secondary/60",
      sub: stats.pending > 0 ? "aguardando ação" : "sem pendências",
    },
    {
      label: "Confirmados",
      value: stats.confirmed,
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      sub: "em andamento",
    },
    {
      label: "Entregues",
      value: stats.delivered,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      sub: "concluídos",
    },
    {
      label: "Cancelados",
      value: stats.cancelled,
      icon: XCircle,
      color: stats.cancelled > 0 ? "text-red-400" : "text-muted-foreground",
      bg: stats.cancelled > 0 ? "bg-red-400/10" : "bg-secondary/60",
      sub: stats.cancelled > 0 ? "atenção necessária" : "nenhum cancelamento",
    },
    {
      label: "Receita Total",
      value: fmt(stats.revenue),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      isText: true,
      sub: "de todos os pedidos",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="admin-card p-4 flex flex-col gap-1.5"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">
              {card.label}
            </span>
            <div className={`${card.bg} ${card.color} p-1.5 rounded-lg shrink-0`}>
              <card.icon className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="text-[22px] font-bold tabular-nums leading-none text-foreground">
            {card.value}
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">{card.sub}</span>
        </motion.div>
      ))}
    </div>
  );
};
