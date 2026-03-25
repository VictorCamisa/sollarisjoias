import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ListTodo, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const priorityConfig = {
  low: { label: "Baixa", color: "text-muted-foreground", bg: "bg-muted/50" },
  medium: { label: "Média", color: "text-blue-500", bg: "bg-blue-500/10" },
  high: { label: "Alta", color: "text-amber-500", bg: "bg-amber-500/10" },
  urgent: { label: "Urgente", color: "text-red-500", bg: "bg-red-500/10" },
};

const statusConfig = {
  todo: { label: "A fazer", icon: ListTodo, color: "text-muted-foreground" },
  in_progress: { label: "Em andamento", icon: Clock, color: "text-blue-500" },
  done: { label: "Concluído", icon: CheckCircle2, color: "text-emerald-500" },
};

const AdminTarefas = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ title: "", description: "", due_date: "", priority: "medium" });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        title: form.title, description: form.description || null,
        due_date: form.due_date || null, priority: form.priority, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success("Tarefa criada!");
      setDialogOpen(false);
      setForm({ title: "", description: "", due_date: "", priority: "medium" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...update }: { id: string; status?: string }) => {
      const { error } = await supabase.from("tasks").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success("Tarefa removida");
    },
  });

  const filtered = tasks?.filter((t) => filterStatus === "all" || t.status === filterStatus);
  const todoCount = tasks?.filter((t) => t.status === "todo").length ?? 0;
  const inProgressCount = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const doneCount = tasks?.filter((t) => t.status === "done").length ?? 0;

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tarefas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Organize seu dia a dia</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg gap-2 h-9 text-xs"><Plus className="h-3.5 w-3.5" /> Nova tarefa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle >Nova Tarefa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg h-9 mt-1" placeholder="O que precisa fazer?" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Prazo</Label>
                  <Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="rounded-lg h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="rounded-lg h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => createTask.mutate()} disabled={!form.title} className="w-full rounded-lg h-9">Criar tarefa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "A fazer", count: todoCount, icon: ListTodo, color: "text-muted-foreground", bg: "bg-secondary" },
          { label: "Em andamento", count: inProgressCount, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Concluídas", count: doneCount, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold">{s.count}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-40 rounded-lg h-9 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {Object.entries(statusConfig).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
        </SelectContent>
      </Select>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : !filtered?.length ? (
        <div className="text-center py-16">
          <ListTodo className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada. 🎉</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((task, i) => {
            const p = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            const isDone = task.status === "done";
            return (
              <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors ${isDone ? "opacity-50" : ""}`}>
                <Checkbox checked={isDone}
                  onCheckedChange={(checked) => updateTask.mutate({ id: task.id, status: checked ? "done" : "todo" })}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium ${isDone ? "line-through" : ""}`}>{task.title}</p>
                  {task.description && <p className="text-[10px] text-muted-foreground truncate">{task.description}</p>}
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${p.color}`}>{p.label}</Badge>
                  {task.due_date && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(task.due_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
                {!isDone && (
                  <Select value={task.status} onValueChange={(v) => updateTask.mutate({ id: task.id, status: v })}>
                    <SelectTrigger className="w-28 h-7 text-[10px] rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteTask.mutate(task.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTarefas;
