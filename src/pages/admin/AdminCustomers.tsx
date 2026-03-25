import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Users, ArrowLeft, ShoppingBag, DollarSign, Calendar,
  KeyRound, Ban, CheckCircle, Save,
} from "lucide-react";
import { motion } from "framer-motion";

interface Profile {
  id: string; full_name: string | null; phone: string | null;
  address: string | null; notes: string | null; created_at: string; updated_at: string;
}
interface Order {
  id: string; total: number; status: string; items: any; created_at: string;
}

const AdminCustomers = () => {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: customerOrders } = useQuery({
    queryKey: ["admin-customer-orders", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("id, total, status, items, created_at")
        .eq("customer_id", selectedId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles")
        .update({ full_name: editName, phone: editPhone, address: editAddress, notes: editNotes })
        .eq("id", selectedId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Cliente atualizado" });
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  const manageUser = useMutation({
    mutationFn: async (params: { action: string; password?: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: params.action, userId: selectedId, password: params.password },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({ title: data?.message || "Ação executada" });
      setNewPassword("");
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const filtered = customers?.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.full_name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
  });

  const selected = customers?.find((c) => c.id === selectedId);
  const selectCustomer = (c: Profile) => {
    setSelectedId(c.id); setEditName(c.full_name || ""); setEditPhone(c.phone || "");
    setEditAddress(c.address || ""); setEditNotes(c.notes || "");
  };

  const totalSpent = customerOrders?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
  const orderCount = customerOrders?.length ?? 0;
  const lastOrder = customerOrders?.[0];
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  // Detail
  if (selected) {
    return (
      <div className="max-w-[1400px]">
        <button onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6 transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-base font-bold text-accent">
            {(selected.full_name || "?")[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-semibold">{selected.full_name || "Sem nome"}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Cliente desde {new Date(selected.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total gasto", value: fmt(totalSpent), icon: DollarSign },
            { label: "Pedidos", value: orderCount, icon: ShoppingBag },
            { label: "Ticket médio", value: fmt(orderCount > 0 ? totalSpent / orderCount : 0), icon: DollarSign },
            { label: "Último pedido", value: lastOrder ? new Date(lastOrder.created_at).toLocaleDateString("pt-BR") : "—", icon: Calendar },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                <m.icon className="h-3 w-3" /> {m.label}
              </div>
              <p className="text-base font-bold">{m.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados do cliente</h2>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-lg h-9 mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="rounded-lg h-9 mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Endereço</label>
                <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="rounded-lg h-9 mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Notas internas</label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="rounded-lg mt-1" rows={2} />
              </div>
              <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}
                className="gap-2 rounded-lg h-9 text-xs w-full">
                <Save className="h-3.5 w-3.5" /> Salvar
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações da conta</h2>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                <KeyRound className="h-3 w-3" /> Resetar senha
              </div>
              <Input type="password" placeholder="Nova senha (mín. 6)" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} className="rounded-lg h-9" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-lg h-7 text-[10px]"
                  disabled={newPassword.length < 6 || manageUser.isPending}
                  onClick={() => manageUser.mutate({ action: "reset_password", password: newPassword })}>
                  Definir senha
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg h-7 text-[10px]"
                  disabled={manageUser.isPending}
                  onClick={() => manageUser.mutate({ action: "reset_password" })}>
                  Enviar email
                </Button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                <Ban className="h-3 w-3" /> Gerenciar acesso
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="rounded-lg h-7 text-[10px]"
                  disabled={manageUser.isPending} onClick={() => manageUser.mutate({ action: "disable" })}>
                  <Ban className="h-3 w-3 mr-1" /> Desativar
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg h-7 text-[10px]"
                  disabled={manageUser.isPending} onClick={() => manageUser.mutate({ action: "enable" })}>
                  <CheckCircle className="h-3 w-3 mr-1" /> Reativar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Histórico de pedidos</h2>
        {customerOrders && customerOrders.length > 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {customerOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium">
                    {Array.isArray(o.items) ? `${(o.items as any[]).length} itens` : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <Badge variant="secondary" className="text-[9px]">{o.status}</Badge>
                  <span className="text-[13px] font-semibold tabular-nums">{fmt(Number(o.total))}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum pedido vinculado.</p>
        )}
      </div>
    );
  }

  // List
  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Clientes</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{customers?.length ?? 0} cadastrados</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar por nome, telefone..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-lg h-9 text-xs" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-card/50 rounded-lg animate-pulse" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((c, i) => (
            <motion.button key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              onClick={() => selectCustomer(c)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                {(c.full_name || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{c.full_name || "Sem nome"}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {c.phone || "Sem telefone"} · {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
