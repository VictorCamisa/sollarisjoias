import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminCupons = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    min_order_value: "",
    max_uses: "",
    expires_at: "",
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCoupon = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Cupom criado!");
      setDialogOpen(false);
      setForm({ code: "", discount_type: "percentage", discount_value: "", min_order_value: "", max_uses: "", expires_at: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Cupom excluído");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-serif font-semibold">Cupons</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Cupons</h1>
          <p className="text-xs text-muted-foreground mt-1">{coupons?.length ?? 0} cupons</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> Novo cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cupom</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="rounded-xl uppercase" placeholder="Ex: VERAO10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v as any })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor do desconto</Label>
                  <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="rounded-xl" placeholder={form.discount_type === "percentage" ? "10" : "25.00"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pedido mínimo (R$)</Label>
                  <Input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: e.target.value })} className="rounded-xl" placeholder="0" />
                </div>
                <div>
                  <Label>Máx. de usos</Label>
                  <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="rounded-xl" placeholder="Ilimitado" />
                </div>
              </div>
              <div>
                <Label>Expira em</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="rounded-xl" />
              </div>
              <Button onClick={() => createCoupon.mutate()} disabled={!form.code || !form.discount_value} className="w-full rounded-xl">
                Criar cupom
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!coupons?.length ? (
        <div className="text-center py-16">
          <Ticket className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum cupom criado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c, i) => {
            const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
            const isMaxed = c.max_uses && c.used_count >= c.max_uses;
            return (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className={`border border-border rounded-xl p-4 bg-card flex items-center justify-between gap-4 ${(!c.is_active || isExpired || isMaxed) ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-semibold">{c.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${Number(c.discount_value).toFixed(2).replace(".", ",")}`}
                      {Number(c.min_order_value) > 0 && ` · Mín. R$ ${Number(c.min_order_value).toFixed(2).replace(".", ",")}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{c.used_count} usos{c.max_uses ? ` / ${c.max_uses}` : ""}</span>
                      {isExpired && <Badge variant="destructive" className="text-[10px]">Expirado</Badge>}
                      {isMaxed && <Badge variant="secondary" className="text-[10px]">Esgotado</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={c.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: c.id, is_active: v })} />
                  <button onClick={() => deleteCoupon.mutate(c.id)} className="p-2 rounded-lg hover:bg-secondary transition">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCupons;
