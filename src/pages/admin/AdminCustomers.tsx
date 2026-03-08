import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Users,
  ArrowLeft,
  ShoppingBag,
  DollarSign,
  Calendar,
  KeyRound,
  Ban,
  CheckCircle,
  Save,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
  items: any;
  created_at: string;
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: customerOrders } = useQuery({
    queryKey: ["admin-customer-orders", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, items, created_at")
        .eq("customer_id", selectedId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName,
          phone: editPhone,
          address: editAddress,
          notes: editNotes,
        })
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
      const { data, error } = await supabase.functions.invoke(
        "admin-manage-user",
        {
          body: { action: params.action, userId: selectedId, password: params.password },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({ title: data?.message || "Ação executada" });
      setNewPassword("");
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const filtered = customers?.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const selected = customers?.find((c) => c.id === selectedId);

  const selectCustomer = (c: Profile) => {
    setSelectedId(c.id);
    setEditName(c.full_name || "");
    setEditPhone(c.phone || "");
    setEditAddress(c.address || "");
    setEditNotes(c.notes || "");
  };

  const totalSpent = customerOrders?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
  const orderCount = customerOrders?.length ?? 0;
  const lastOrder = customerOrders?.[0];

  // Detail view
  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-lg font-semibold">
            {(selected.full_name || "?")[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-serif font-semibold">
              {selected.full_name || "Sem nome"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Cliente desde{" "}
              {new Date(selected.created_at).toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" /> Total gasto
            </div>
            <p className="text-lg font-semibold">
              R$ {totalSpent.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <ShoppingBag className="h-3 w-3" /> Pedidos
            </div>
            <p className="text-lg font-semibold">{orderCount}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" /> Ticket médio
            </div>
            <p className="text-lg font-semibold">
              R${" "}
              {orderCount > 0
                ? (totalSpent / orderCount).toFixed(2).replace(".", ",")
                : "0,00"}
            </p>
          </div>
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calendar className="h-3 w-3" /> Último pedido
            </div>
            <p className="text-lg font-semibold">
              {lastOrder
                ? new Date(lastOrder.created_at).toLocaleDateString("pt-BR")
                : "—"}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Dados do cliente</h2>
            <div>
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Telefone</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Endereço</label>
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Notas internas (só admin vê)
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" /> Salvar alterações
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Ações da conta</h2>
            <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <KeyRound className="h-3 w-3" /> Resetar senha
              </div>
              <Input
                type="password"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={newPassword.length < 6 || manageUser.isPending}
                  onClick={() =>
                    manageUser.mutate({
                      action: "reset_password",
                      password: newPassword,
                    })
                  }
                >
                  Definir nova senha
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={manageUser.isPending}
                  onClick={() => manageUser.mutate({ action: "reset_password" })}
                >
                  Enviar email de recuperação
                </Button>
              </div>
            </div>

            <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Ban className="h-3 w-3" /> Gerenciar acesso
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={manageUser.isPending}
                  onClick={() => manageUser.mutate({ action: "disable" })}
                >
                  <Ban className="h-3 w-3 mr-1" /> Desativar conta
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={manageUser.isPending}
                  onClick={() => manageUser.mutate({ action: "enable" })}
                >
                  <CheckCircle className="h-3 w-3 mr-1" /> Reativar conta
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Order history */}
        <h2 className="text-sm font-semibold mb-4">Histórico de pedidos</h2>
        {customerOrders && customerOrders.length > 0 ? (
          <div className="space-y-2">
            {customerOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl"
              >
                <div>
                  <p className="text-sm font-medium">
                    {Array.isArray(o.items) ? `${(o.items as any[]).length} itens` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    R$ {Number(o.total).toFixed(2).replace(".", ",")}
                  </p>
                  <Badge variant="secondary" className="text-[10px]">
                    {o.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum pedido vinculado.
          </p>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Clientes</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {customers?.length ?? 0} cadastrados
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCustomer(c)}
              className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/30 transition text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {(c.full_name || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {c.full_name || "Sem nome"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.phone || "Sem telefone"} •{" "}
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-10">
          Nenhum cliente encontrado.
        </p>
      )}
    </div>
  );
};

export default AdminCustomers;
