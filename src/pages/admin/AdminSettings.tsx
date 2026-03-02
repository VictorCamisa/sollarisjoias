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

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsapp_number);
      setStoreName(settings.store_name);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      const { error } = await supabase
        .from("settings")
        .update({ whatsapp_number: whatsapp, store_name: storeName })
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
        <Button onClick={() => mutation.mutate()} className="rounded-xl" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
