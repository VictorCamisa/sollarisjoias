import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useStore";
import { toast } from "sonner";

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
      const { error } = await supabase
        .from("settings")
        .update({
          whatsapp_number: whatsapp,
          store_name: storeName,
          pix_discount_percent: parseFloat(pixDiscount) || 5,
          monthly_goal: parseFloat(monthlyGoal) || 15000,
        } as any)
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-serif font-semibold mb-8">Configurações</h1>

      <div className="max-w-md space-y-6">
        <div>
          <Label className="text-xs">Nome da Loja</Label>
          <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-xl mt-1" />
        </div>
        <div>
          <Label className="text-xs">Número do WhatsApp (com DDI)</Label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="rounded-xl mt-1" placeholder="5511999999999" />
          <p className="text-[11px] text-muted-foreground mt-1">Formato: 55 + DDD + número, sem espaços</p>
        </div>
        <div>
          <Label className="text-xs">Desconto PIX (%)</Label>
          <Input type="number" step="0.5" min="0" max="50" value={pixDiscount} onChange={(e) => setPixDiscount(e.target.value)} className="rounded-xl mt-1" />
          <p className="text-[11px] text-muted-foreground mt-1">Percentual de desconto para pagamento via PIX</p>
        </div>
        <div>
          <Label className="text-xs">Meta Mensal de Faturamento (R$)</Label>
          <Input type="number" step="500" min="0" value={monthlyGoal} onChange={(e) => setMonthlyGoal(e.target.value)} className="rounded-xl mt-1" />
          <p className="text-[11px] text-muted-foreground mt-1">Meta exibida no dashboard do admin</p>
        </div>
        <Button onClick={() => mutation.mutate()} className="rounded-xl" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
