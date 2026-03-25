import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const generateSlug = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = generateSlug(name);
      if (editingId) {
        const { error } = await supabase.from("categories").update({ name, slug }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert({ name, slug });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-category-count"] });
      toast.success(editingId ? "Atualizada!" : "Criada!");
      setOpen(false); setEditingId(null); setName("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-category-count"] });
      toast.success("Excluída!");
    },
  });

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Categorias</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{categories?.length ?? 0} categorias</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setName(""); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-lg gap-2 h-9 text-xs" size="sm"><Plus className="h-3.5 w-3.5" /> Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle >{editingId ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg h-9 mt-1" required />
              </div>
              <Button type="submit" className="w-full rounded-lg h-9" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : categories && categories.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_200px_70px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <span>Nome</span>
            <span>Slug</span>
            <span></span>
          </div>
          <div className="divide-y divide-border">
            {categories.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_200px_70px] gap-3 items-center px-4 py-3 hover:bg-secondary/30 transition-colors">
                <p className="text-[13px] font-medium">{c.name}</p>
                <span className="hidden md:block text-[11px] text-muted-foreground font-mono">{c.slug}</span>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setEditingId(c.id); setName(c.name); setOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate(c.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
