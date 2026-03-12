import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pin, PinOff, Trash2, Search, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminNotas = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });

  const { data: notes, isLoading } = useQuery({
    queryKey: ["admin-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notes").insert({
        title: form.title,
        content: form.content || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      toast.success("Nota criada!");
      setDialogOpen(false);
      setForm({ title: "", content: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...update }: { id: string; title?: string; content?: string; is_pinned?: boolean }) => {
      const { error } = await supabase.from("notes").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      setEditing(null);
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      toast.success("Nota excluída");
    },
  });

  const filtered = notes?.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-serif font-semibold">Notas</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Notas</h1>
          <p className="text-xs text-muted-foreground mt-1">{notes?.length ?? 0} notas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> Nova nota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Nota</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" placeholder="Título da nota" />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-xl" rows={6} placeholder="Escreva aqui..." />
              </div>
              <Button onClick={() => createNote.mutate()} disabled={!form.title} className="w-full rounded-xl">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar notas..." className="rounded-xl pl-9" />
      </div>

      {/* Notes grid */}
      {!filtered?.length ? (
        <div className="text-center py-16">
          <StickyNote className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma nota ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note, i) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-card border rounded-2xl p-5 flex flex-col ${note.is_pinned ? "border-primary/30" : "border-border"}`}>
              {editing === note.id ? (
                <div className="space-y-3 flex-1">
                  <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="rounded-xl text-sm font-medium" />
                  <Textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} className="rounded-xl text-xs flex-1" rows={4} />
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-lg text-xs" onClick={() => updateNote.mutate({ id: note.id, title: editForm.title, content: editForm.content })}>Salvar</Button>
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => setEditing(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold cursor-pointer hover:text-primary transition"
                      onClick={() => { setEditing(note.id); setEditForm({ title: note.title, content: note.content || "" }); }}>
                      {note.title}
                    </h3>
                    <button onClick={() => updateNote.mutate({ id: note.id, is_pinned: !note.is_pinned })}
                      className="text-muted-foreground hover:text-primary transition p-1">
                      {note.is_pinned ? <Pin className="h-3.5 w-3.5 text-primary" /> : <PinOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap flex-1 cursor-pointer"
                    onClick={() => { setEditing(note.id); setEditForm({ title: note.title, content: note.content || "" }); }}>
                    {note.content || "Clique para editar..."}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(note.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                    <button onClick={() => deleteNote.mutate(note.id)}
                      className="text-muted-foreground hover:text-destructive transition p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotas;
