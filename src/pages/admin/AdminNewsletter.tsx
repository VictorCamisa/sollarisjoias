import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminNewsletter = () => {
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Newsletter</h1>
          <p className="text-xs text-muted-foreground mt-1">{subscribers?.length ?? 0} inscritos</p>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : subscribers && subscribers.length > 0 ? (
          subscribers.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.email}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">Nenhum inscrito ainda.</p>
        )}
      </div>
    </div>
  );
};

export default AdminNewsletter;
