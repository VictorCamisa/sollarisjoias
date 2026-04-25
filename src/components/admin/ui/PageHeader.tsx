import { motion } from "framer-motion";
import { ReactNode } from "react";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  hub?: "comercial" | "operacao" | "financas";
}

const hubColor: Record<NonNullable<PageHeaderProps["hub"]>, string> = {
  comercial: "bg-hub-comercial",
  operacao: "bg-hub-operacao",
  financas: "bg-hub-financas",
};

export const PageHeader = ({ title, subtitle, actions, hub }: PageHeaderProps) => (
  <motion.header
    variants={staggerContainer}
    initial="initial"
    animate="animate"
    className="flex items-start justify-between gap-4 pb-1"
  >
    <motion.div variants={staggerItem} className="min-w-0 flex-1">
      {hub && (
        <div className="flex items-center gap-2 mb-2">
          <span className={`h-1.5 w-1.5 rounded-full ${hubColor[hub]}`} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {hub === "comercial" ? "Comercial" : hub === "operacao" ? "Operação" : "Finanças"}
          </span>
        </div>
      )}
      <h1 className="admin-page-title">{title}</h1>
      {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
    </motion.div>
    {actions && (
      <motion.div variants={staggerItem} className="flex items-center gap-2 flex-shrink-0">
        {actions}
      </motion.div>
    )}
  </motion.header>
);
