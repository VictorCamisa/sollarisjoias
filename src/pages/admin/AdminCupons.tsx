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
import { Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminCupons = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "", min_order_value: "", max_uses: "", expires_at: "",
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCoupon = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase().trim(), discount_type: form.discount_type,
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

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cupons</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{coupons?.length ?? 0} cupons</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg gap-2 h-9 text-xs"><Plus className="h-3.5 w-3.5" /> Novo cupom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle >Novo Cupom</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Código</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="rounded-lg h-9 mt-1 uppercase font-mono" placeholder="VERAO10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v as any })}>
                    <SelectTrigger className="rounded-lg h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor</Label>
                  <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="rounded-lg h-9 mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pedido mínimo (R$)</Label>
                  <Input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: e.target.value })} className="rounded-lg h-9 mt-1" placeholder="0" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Máx. usos</Label>
                  <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="rounded-lg h-9 mt-1" placeholder="∞" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Expira em</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="rounded-lg h-9 mt-1" />
              </div>
              <Button onClick={() => createCoupon.mutate()} disabled={!form.code || !form.discount_value} className="w-full rounded-lg h-9">Criar cupom</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : !coupons?.length ? (
        <div className="text-center py-16">
          <Ticket className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum cupom criado.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_100px_100px_80px_100px_80px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <span>Código</span>
            <span>Desconto</span>
            <span>Mín. pedido</span>
            <span className="text-center">Usos</span>
            <span className="text-center">Status</span>
            <span></span>
          </div>
          <div className="divide-y divide-border">
            {coupons.map((c, i) => {
              const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
              const isMaxed = c.max_uses && c.used_count >= c.max_uses;
              const inactive = !c.is_active || isExpired || isMaxed;
              return (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_100px_80px_100px_80px] gap-2 md:gap-3 items-center px-4 py-3 hover:bg-secondary/30 transition-colors ${inactive ? "opacity-50" : ""}`}>
                  <div>
                    <p className="text-[13px] font-mono font-semibold">{c.code}</p>
                  </div>
                  <span className="hidden md:block text-xs">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${Number(c.discount_value).toFixed(2).replace(".", ",")}`}
                  </span>
                  <span className="hidden md:block text-[11px] text-muted-foreground">
                    {Number(c.min_order_value) > 0 ? `R$ ${Number(c.min_order_value).toFixed(2).replace(".", ",")}` : "—"}
                  </span>
                  <span className="hidden md:block text-[11px] text-muted-foreground text-center">
                    {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}
                  </span>
                  <div className="hidden md:flex justify-center items-center gap-2">
                    {isExpired && <Badge variant="destructive" className="text-[9px]">Expirado</Badge>}
                    {isMaxed && !isExpired && <Badge variant="secondary" className="text-[9px]">Esgotado</Badge>}
                    {!isExpired && !isMaxed && <Switch checked={c.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: c.id, is_active: v })} />}
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCoupon.mutate(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCupons;
