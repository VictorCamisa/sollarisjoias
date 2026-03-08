import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, ShoppingBag, LogOut, Save } from "lucide-react";

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/conta/login");
  }, [user, loading]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
    }
  }, [profile]);

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, items, created_at")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, address })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Perfil atualizado!" });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  if (loading || !user) return null;

  return (
    <div className="container mx-auto px-6 py-10 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-serif font-semibold">Minha conta</h1>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>

      {/* Profile form */}
      <div className="p-6 bg-card border border-border rounded-2xl mb-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Dados pessoais</h2>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Nome</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Telefone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Endereço</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">E-mail</label>
          <Input value={user.email || ""} disabled />
        </div>
        <Button
          onClick={() => updateProfile.mutate()}
          disabled={updateProfile.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" /> Salvar
        </Button>
      </div>

      {/* Orders */}
      <div className="flex items-center gap-3 mb-4">
        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Meus pedidos</h2>
      </div>
      {orders && orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((o) => (
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
          Você ainda não fez nenhum pedido.
        </p>
      )}
    </div>
  );
};

export default Account;
