import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";

const AdminNewsletter = () => {
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Newsletter</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{subscribers?.length ?? 0} inscritos</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : subscribers && subscribers.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_160px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <span>Email</span>
            <span>Data de inscrição</span>
          </div>
          <div className="divide-y divide-border">
            {subscribers.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_160px] gap-3 items-center px-4 py-3 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-3 w-3 text-accent" />
                  </div>
                  <span className="text-[13px] font-medium truncate">{s.email}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Mail className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum inscrito ainda.</p>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
