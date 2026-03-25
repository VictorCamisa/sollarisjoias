import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useStore";
import { toast } from "sonner";
import { Settings } from "lucide-react";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSettings();
  const [whatsapp, setWhatsapp] = useState("");
  const [storeName, setStoreName] = useState("");
  const [pixDiscount, setPixDiscount] = useState("5");
  const [monthlyGoal, setMonthlyGoal] = useState("15000");

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsapp_number);
      setStoreName(settings.store_name);
      setPixDiscount(String(settings.pix_discount_percent ?? 5));
      setMonthlyGoal(String((settings as any).monthly_goal ?? 15000));
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      const { error } = await supabase.from("settings").update({
        whatsapp_number: whatsapp, store_name: storeName,
        pix_discount_percent: parseFloat(pixDiscount) || 5,
        monthly_goal: parseFloat(monthlyGoal) || 15000,
      } as any).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Configurações gerais da loja</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome da Loja</Label>
          <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-lg h-9 mt-1" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">WhatsApp (com DDI)</Label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="rounded-lg h-9 mt-1" placeholder="5511999999999" />
          <p className="text-[9px] text-muted-foreground mt-1">Formato: 55 + DDD + número</p>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Desconto PIX (%)</Label>
          <Input type="number" step="0.5" min="0" max="50" value={pixDiscount}
            onChange={(e) => setPixDiscount(e.target.value)} className="rounded-lg h-9 mt-1" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Meta Mensal (R$)</Label>
          <Input type="number" step="500" min="0" value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)} className="rounded-lg h-9 mt-1" />
          <p className="text-[9px] text-muted-foreground mt-1">Exibida no dashboard</p>
        </div>
        <Button onClick={() => mutation.mutate()} className="rounded-lg h-9 w-full text-xs" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
