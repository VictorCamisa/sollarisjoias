import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, MapPin, ArrowRight } from "lucide-react";

const AccountOverview = () => {
  const { user } = useAuth();

  const { data: orderStats } = useQuery({
    queryKey: ["account-stats", user?.id],
    queryFn: async () => {
      if (!user) return { count: 0 };
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id);
      return { count: count ?? 0 };
    },
    enabled: !!user,
  });

  const { data: addrCount } = useQuery({
    queryKey: ["account-addresses-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("customer_addresses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border p-6 sm:p-8">
        <h2 className="font-display text-2xl text-foreground mb-2">Bem-vinda à Sollaris.</h2>
        <p className="font-sans text-foreground/65 text-sm leading-relaxed">
          Aqui você acompanha seus pedidos, gerencia endereços salvos e recebe ofertas exclusivas
          da curadoria Sollaris.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/conta/pedidos"
          className="bg-card border border-border p-6 hover:border-bordeaux/40 transition-colors group"
        >
          <Package className="h-5 w-5 text-bordeaux mb-4" strokeWidth={1.5} />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-1">
            Pedidos
          </p>
          <p className="font-display text-2xl text-foreground tabular-nums">{orderStats?.count ?? 0}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-bordeaux mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver pedidos <ArrowRight className="h-3 w-3" strokeWidth={1.6} />
          </p>
        </Link>

        <Link
          to="/conta/enderecos"
          className="bg-card border border-border p-6 hover:border-bordeaux/40 transition-colors group"
        >
          <MapPin className="h-5 w-5 text-bordeaux mb-4" strokeWidth={1.5} />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-1">
            Endereços salvos
          </p>
          <p className="font-display text-2xl text-foreground tabular-nums">{addrCount ?? 0}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-bordeaux mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Gerenciar <ArrowRight className="h-3 w-3" strokeWidth={1.6} />
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AccountOverview;
