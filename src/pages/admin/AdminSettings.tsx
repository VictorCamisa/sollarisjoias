import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/useStore";
import { toast } from "sonner";
import {
  Settings, Smartphone, Wifi, WifiOff, Plus, Trash2, RefreshCw, QrCode,
  Users, UserPlus, Shield, Ban, CheckCircle, KeyRound, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface SystemUser {
  id: string;
  email: string;
  full_name: string;
  cargo: string;
  phone: string;
  role: string;
  created_at: string;
  banned_until: string | null;
}

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSettings();
  const [whatsapp, setWhatsapp] = useState("");
  const [storeName, setStoreName] = useState("");
  const [pixDiscount, setPixDiscount] = useState("5");
  const [monthlyGoal, setMonthlyGoal] = useState("15000");

  // Evolution API instance
  const [instanceName, setInstanceName] = useState("");
  const [instanceStatus, setInstanceStatus] = useState<"disconnected" | "connecting" | "connected" | "unknown">("unknown");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [connectedInstance, setConnectedInstance] = useState<string | null>(null);

  // User management
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", cargo: "", role: "admin" });
  const [resetPwdUser, setResetPwdUser] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings.whatsapp_number);
      setStoreName(settings.store_name);
      setPixDiscount(String(settings.pix_discount_percent ?? 5));
      setMonthlyGoal(String((settings as any).monthly_goal ?? 15000));
      const saved = (settings as any).evolution_instance;
      if (saved) {
        setConnectedInstance(saved);
        setInstanceName(saved);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (connectedInstance) {
      checkInstanceStatus(connectedInstance);
    }
  }, [connectedInstance]);

  // Fetch system users
  const { data: systemUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["system-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (data?.users || []) as SystemUser[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      const { error } = await supabase.from("settings").update({
        whatsapp_number: whatsapp,
        store_name: storeName,
        pix_discount_percent: parseFloat(pixDiscount) || 5,
        monthly_goal: parseFloat(monthlyGoal) || 15000,
      } as any).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: {
          action: "create",
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          cargo: newUser.cargo,
          role: newUser.role,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-users"] });
      toast.success("Usuário criado com sucesso!");
      setShowNewUser(false);
      setNewUser({ email: "", password: "", full_name: "", cargo: "", role: "admin" });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar usuário"),
  });

  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "disable" | "enable" }) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action, userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-users"] });
      toast.success("Status atualizado!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "delete", userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-users"] });
      toast.success("Usuário excluído!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!resetPwdUser) return;
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "reset_password", userId: resetPwdUser.id, password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("Senha atualizada!");
      setResetPwdUser(null);
      setNewPassword("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const checkInstanceStatus = async (name: string) => {
    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("evolution-instance", {
        body: { action: "status", instanceName: name },
      });
      if (error) throw error;
      const state = data?.instance?.state || data?.state;
      if (state === "open" || state === "connected") {
        setInstanceStatus("connected");
        setQrCode(null);
      } else if (state === "connecting") {
        setInstanceStatus("connecting");
      } else {
        setInstanceStatus("disconnected");
      }
    } catch (err) {
      console.error("Status check error:", err);
      setInstanceStatus("unknown");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const createInstance = async () => {
    if (!instanceName.trim()) { toast.error("Digite o nome da instância"); return; }
    setIsCreating(true);
    setQrCode(null);
    try {
      const { data, error } = await supabase.functions.invoke("evolution-instance", {
        body: { action: "create", instanceName: instanceName.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success("Instância criada! Escaneie o QR Code para conectar.");
      setConnectedInstance(instanceName.trim());
      if (settings) {
        await supabase.from("settings").update({ evolution_instance: instanceName.trim() } as any).eq("id", settings.id);
      }
      if (data?.qrcode) { setQrCode(data.qrcode); setInstanceStatus("connecting"); }
      else { await fetchQrCode(instanceName.trim()); }
    } catch (err: any) {
      console.error("Create instance error:", err);
      toast.error(err.message || "Erro ao criar instância");
    } finally { setIsCreating(false); }
  };

  const fetchQrCode = async (name: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("evolution-instance", {
        body: { action: "qrcode", instanceName: name },
      });
      if (error) throw error;
      const base64 = data?.base64 || data?.qrcode?.base64 || data?.code;
      if (base64) {
        setQrCode(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`);
        setInstanceStatus("connecting");
      }
    } catch (err) { console.error("QR code error:", err); }
  };

  const deleteInstance = async () => {
    if (!connectedInstance) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("evolution-instance", {
        body: { action: "delete", instanceName: connectedInstance },
      });
      if (error) throw error;
      toast.success("Instância desconectada");
      setConnectedInstance(null);
      setInstanceStatus("unknown");
      setQrCode(null);
      setInstanceName("");
      if (settings) {
        await supabase.from("settings").update({ evolution_instance: null } as any).eq("id", settings.id);
      }
    } catch (err: any) {
      console.error("Delete instance error:", err);
      toast.error(err.message || "Erro ao desconectar");
    } finally { setIsDeleting(false); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const isBanned = (user: SystemUser) => {
    if (!user.banned_until) return false;
    return new Date(user.banned_until) > new Date();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Configurações gerais da loja e gestão de usuários</p>
      </div>

      {/* ── USERS MANAGEMENT ── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Usuários do Sistema</h3>
              <p className="text-[10px] text-muted-foreground">Gerencie o acesso ao painel administrativo</p>
            </div>
          </div>
          <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs rounded-lg gap-1.5">
                <UserPlus className="h-3.5 w-3.5" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                  <Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="rounded-lg h-9 mt-1" placeholder="Ex: Maria Silva" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email de Acesso</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="rounded-lg h-9 mt-1" placeholder="usuario@sollaris.com" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Senha</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="rounded-lg h-9 mt-1" placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cargo</Label>
                  <Input value={newUser.cargo} onChange={(e) => setNewUser({ ...newUser, cargo: e.target.value })}
                    className="rounded-lg h-9 mt-1" placeholder="Ex: Vendedora, Assistente, CEO" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Perfil de Acesso</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                    <SelectTrigger className="rounded-lg h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => createUserMutation.mutate()}
                  className="w-full h-9 text-xs rounded-lg"
                  disabled={createUserMutation.isPending || !newUser.email || !newUser.password || !newUser.full_name}
                >
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {usersLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase">Nome</TableHead>
                  <TableHead className="text-[10px] uppercase">Email</TableHead>
                  <TableHead className="text-[10px] uppercase">Cargo</TableHead>
                  <TableHead className="text-[10px] uppercase">Perfil</TableHead>
                  <TableHead className="text-[10px] uppercase">Status</TableHead>
                  <TableHead className="text-[10px] uppercase text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(systemUsers || []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-xs font-medium">{user.full_name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-xs">{user.cargo || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                        {user.role === "admin" ? (
                          <><Shield className="h-3 w-3 mr-1" />Admin</>
                        ) : "Usuário"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isBanned(user) ? (
                        <Badge variant="destructive" className="text-[10px]"><Ban className="h-3 w-3 mr-1" />Desativado</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-green-500/15 text-green-500 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Redefinir senha"
                          onClick={() => setResetPwdUser(user)}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title={isBanned(user) ? "Reativar" : "Desativar"}
                          onClick={() => toggleUserMutation.mutate({
                            userId: user.id,
                            action: isBanned(user) ? "enable" : "disable",
                          })}
                        >
                          {isBanned(user) ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Ban className="h-3.5 w-3.5 text-destructive" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          title="Excluir usuário"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir ${user.full_name || user.email}?`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!systemUsers || systemUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Reset password dialog */}
      <Dialog open={!!resetPwdUser} onOpenChange={(open) => { if (!open) { setResetPwdUser(null); setNewPassword(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Redefinir senha de <strong>{resetPwdUser?.full_name || resetPwdUser?.email}</strong>
            </p>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg h-9 mt-1" placeholder="Nova senha" />
            </div>
            <Button
              onClick={() => resetPasswordMutation.mutate()}
              className="w-full h-9 text-xs rounded-lg"
              disabled={resetPasswordMutation.isPending || !newPassword || newPassword.length < 6}
            >
              {resetPasswordMutation.isPending ? "Salvando..." : "Atualizar Senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* General Settings */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome da Loja</Label>
          <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-lg h-9 mt-1" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">WhatsApp (com DDI)</Label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="rounded-lg h-9 mt-1" placeholder="5511999999999" />
          <p className="text-[9px] text-muted-foreground mt-1">Formato: 55 + DDD + número</p>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Desconto PIX (%)</Label>
          <Input type="number" step="0.5" min="0" max="50" value={pixDiscount}
            onChange={(e) => setPixDiscount(e.target.value)} className="rounded-lg h-9 mt-1" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Meta Mensal (R$)</Label>
          <Input type="number" step="500" min="0" value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)} className="rounded-lg h-9 mt-1" />
          <p className="text-[9px] text-muted-foreground mt-1">Exibida no dashboard</p>
        </div>
        <Button onClick={() => mutation.mutate()} className="rounded-lg h-9 w-full text-xs" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      {/* WhatsApp Instance (Evolution API) */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Instância WhatsApp</h3>
              <p className="text-[10px] text-muted-foreground">Evolution API — Conexão automática</p>
            </div>
          </div>
          {connectedInstance && (
            <Badge
              className={`text-[10px] ${
                instanceStatus === "connected"
                  ? "bg-green-500/15 text-green-400 border-green-500/20"
                  : instanceStatus === "connecting"
                  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
                  : "bg-red-500/15 text-red-400 border-red-500/20"
              }`}
            >
              {instanceStatus === "connected" ? (
                <><Wifi className="h-3 w-3 mr-1" /> Conectado</>
              ) : instanceStatus === "connecting" ? (
                <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Conectando</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>
              )}
            </Badge>
          )}
        </div>

        {!connectedInstance ? (
          <>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome da Instância</Label>
              <Input
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                className="rounded-lg h-9 mt-1"
                placeholder="sollaris-principal"
              />
              <p className="text-[9px] text-muted-foreground mt-1">Apenas letras, números, - e _</p>
            </div>
            <Button
              onClick={createInstance}
              className="rounded-lg h-9 w-full text-xs bg-green-600 hover:bg-green-700"
              disabled={isCreating || !instanceName.trim()}
            >
              {isCreating ? (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Criando instância...</>
              ) : (
                <><Plus className="h-3.5 w-3.5 mr-1.5" /> Criar e Conectar Instância</>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Instância:</span>
              <code className="bg-muted px-2 py-0.5 rounded text-[11px] font-mono">{connectedInstance}</code>
            </div>

            {qrCode && instanceStatus !== "connected" && (
              <div className="flex flex-col items-center gap-3 py-3">
                <div className="bg-white p-3 rounded-xl">
                  <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48 object-contain" />
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Abra o WhatsApp → Aparelhos conectados → Escanear QR Code
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8 rounded-lg"
                onClick={() => checkInstanceStatus(connectedInstance)} disabled={isCheckingStatus}>
                {isCheckingStatus ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Verificar Status
              </Button>
              {instanceStatus !== "connected" && (
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8 rounded-lg"
                  onClick={() => fetchQrCode(connectedInstance)}>
                  <QrCode className="h-3 w-3 mr-1" /> Novo QR Code
                </Button>
              )}
              <Button variant="destructive" size="sm" className="text-xs h-8 rounded-lg"
                onClick={deleteInstance} disabled={isDeleting}>
                {isDeleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;