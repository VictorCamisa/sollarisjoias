import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Truck, Phone, Mail, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminFornecedores = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", contact_name: "", phone: "", email: "", notes: "" });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, contact_name: form.contact_name || null,
        phone: form.phone || null, email: form.email || null, notes: form.notes || null,
      };
      if (editingId) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success(editingId ? "Atualizado!" : "Adicionado!");
      setDialogOpen(false); setEditingId(null);
      setForm({ name: "", contact_name: "", phone: "", email: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success("Removido");
    },
  });

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({ name: s.name, contact_name: s.contact_name || "", phone: s.phone || "", email: s.email || "", notes: s.notes || "" });
    setDialogOpen(true);
  };

  const filtered = suppliers?.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fornecedores</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{suppliers?.length ?? 0} cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm({ name: "", contact_name: "", phone: "", email: "", notes: "" }); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg gap-2 h-9 text-xs"><Plus className="h-3.5 w-3.5" /> Novo fornecedor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle >{editingId ? "Editar" : "Novo"} Fornecedor</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome da empresa</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg h-9 mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Contato</Label>
                <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="rounded-lg h-9 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg h-9 mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-lg mt-1" rows={2} />
              </div>
              <Button onClick={() => upsert.mutate()} disabled={!form.name} className="w-full rounded-lg h-9">{editingId ? "Atualizar" : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar fornecedor..." className="rounded-lg pl-9 h-9 text-xs" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : !filtered?.length ? (
        <div className="text-center py-16">
          <Truck className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_140px_140px_140px_70px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <span>Empresa</span>
            <span>Contato</span>
            <span>Telefone</span>
            <span>Email</span>
            <span></span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_140px_140px_140px_70px] gap-2 md:gap-3 items-center px-4 py-3 hover:bg-secondary/30 transition-colors">
                <p className="text-[13px] font-medium">{s.name}</p>
                <span className="hidden md:block text-[11px] text-muted-foreground">{s.contact_name || "—"}</span>
                <span className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground">
                  {s.phone && <><Phone className="h-3 w-3" />{s.phone}</>}
                  {!s.phone && "—"}
                </span>
                <span className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                  {s.email && <><Mail className="h-3 w-3 flex-shrink-0" />{s.email}</>}
                  {!s.email && "—"}
                </span>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteSupplier.mutate(s.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFornecedores;
