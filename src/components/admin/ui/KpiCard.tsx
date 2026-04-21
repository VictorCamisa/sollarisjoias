import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CountUp } from "./CountUp";
import { staggerItem, springSnappy } from "@/lib/motion";

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: number; // % change vs previous period
  hub?: "comercial" | "operacao" | "financas" | "neutral";
  to?: string;
  onClick?: () => void;
}

const hubBg: Record<NonNullable<KpiCardProps["hub"]>, string> = {
  comercial: "bg-hub-comercial/10 text-hub-comercial",
  operacao: "bg-hub-operacao/10 text-hub-operacao",
  financas: "bg-hub-financas/10 text-hub-financas",
  neutral: "bg-accent/10 text-accent",
};

export const KpiCard = ({
  label,
  value,
  icon: Icon,
  format,
  prefix,
  suffix,
  decimals,
  trend,
  hub = "neutral",
  onClick,
}: KpiCardProps) => {
  const Comp: any = onClick ? motion.button : motion.div;
  return (
    <Comp
      variants={staggerItem}
      whileHover={onClick ? { y: -2, transition: springSnappy } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn(
        "admin-card p-4 flex items-center gap-3 text-left w-full",
        onClick && "cursor-pointer hover:border-primary/40"
      )}
    >
      <div className={cn("admin-kpi-icon", hubBg[hub])}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="admin-kpi-value">
          <CountUp value={value} format={format} prefix={prefix} suffix={suffix} decimals={decimals} />
        </p>
        <p className="admin-kpi-label">{label}</p>
      </div>
      {trend !== undefined && trend !== 0 && (
        <div
          className={cn(
            "flex items-center gap-0.5 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md",
            trend >= 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
          )}
        >
          {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend).toFixed(0)}%
        </div>
      )}
    </Comp>
  );
};
