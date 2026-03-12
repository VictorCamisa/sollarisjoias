import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("suppliers").update({
          name: form.name,
          contact_name: form.contact_name || null,
          phone: form.phone || null,
          email: form.email || null,
          notes: form.notes || null,
        }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert({
          name: form.name,
          contact_name: form.contact_name || null,
          phone: form.phone || null,
          email: form.email || null,
          notes: form.notes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast.success(editingId ? "Fornecedor atualizado!" : "Fornecedor adicionado!");
      setDialogOpen(false);
      setEditingId(null);
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
      toast.success("Fornecedor removido");
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-serif font-semibold">Fornecedores</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Fornecedores</h1>
          <p className="text-xs text-muted-foreground mt-1">{suppliers?.length ?? 0} fornecedores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm({ name: "", contact_name: "", phone: "", email: "", notes: "" }); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> Novo fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da empresa</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <Label>Contato</Label>
                <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="rounded-xl" placeholder="Nome do contato" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl" rows={2} />
              </div>
              <Button onClick={() => upsert.mutate()} disabled={!form.name} className="w-full rounded-xl">
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar fornecedor..." className="rounded-xl pl-9" />
      </div>

      {!filtered?.length ? (
        <div className="text-center py-16">
          <Truck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="border border-border rounded-xl p-4 bg-card flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  {s.contact_name && <p className="text-xs text-muted-foreground">{s.contact_name}</p>}
                  <div className="flex items-center gap-3 mt-0.5">
                    {s.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}
                    {s.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-secondary transition">
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <button onClick={() => deleteSupplier.mutate(s.id)} className="p-2 rounded-lg hover:bg-secondary transition">
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFornecedores;
