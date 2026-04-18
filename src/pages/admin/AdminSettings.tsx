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
  Users, UserPlus, Shield, Ban, CheckCircle, KeyRound, X, Pencil, Filter,
  Brain, Mic, Database, Store, CreditCard, Target, MessageSquare,
  Bot, Volume2, Globe, Server, Lock, AlertTriangle, ChevronDown, ChevronRight,
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
import { cn } from "@/lib/utils";
import { GoogleSheetsConnection } from "@/components/admin/integrations/GoogleSheetsConnection";

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

interface ConfigItem {
  label: string;
  value: string | null | undefined;
  icon: typeof Store;
  sensitive?: boolean;
}

interface ConfigSection {
  title: string;
  icon: typeof Store;
  description: string;
  color: string;
  items: ConfigItem[];
}

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSettings();
  const [whatsapp, setWhatsapp] = useState("");
  const [storeName, setStoreName] = useState("");
  const [pixDiscount, setPixDiscount] = useState("5");
  const [monthlyGoal, setMonthlyGoal] = useState("15000");
  const [instanceName, setInstanceName] = useState("");
  const [instanceStatus, setInstanceStatus] = useState<"disconnected" | "connecting" | "connected" | "unknown">("unknown");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [connectedInstance, setConnectedInstance] = useState<string | null>(null);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", cargo: "", role: "admin" });
  const [resetPwdUser, setResetPwdUser] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [cargoFilter, setCargoFilter] = useState("all");
  const [editingCargoUser, setEditingCargoUser] = useState<SystemUser | null>(null);
  const [editCargoValue, setEditCargoValue] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview"]));

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
    if (connectedInstance) checkInstanceStatus(connectedInstance);
  }, [connectedInstance]);

  // Fetch AI config
  const { data: aiConfig } = useQuery({
    queryKey: ["sales-ai-config"],
    queryFn: async () => {
      const { data } = await supabase.from("sales_ai_config").select("*").limit(1).single();
      return data;
    },
  });

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

  // Build config overview
  const configSections: ConfigSection[] = [
    {
      title: "Loja",
      icon: Store,
      description: "Configurações básicas da loja",
      color: "text-primary",
      items: [
        { label: "Nome da Loja", value: settings?.store_name, icon: Store },
        { label: "WhatsApp", value: settings?.whatsapp_number, icon: Smartphone },
        { label: "Desconto PIX", value: settings?.pix_discount_percent ? `${settings.pix_discount_percent}%` : null, icon: CreditCard },
        { label: "Meta Mensal", value: (settings as any)?.monthly_goal ? `R$ ${(settings as any).monthly_goal}` : null, icon: Target },
      ],
    },
    {
      title: "WhatsApp (Evolution API)",
      icon: MessageSquare,
      description: "Conexão com o WhatsApp Business",
      color: "text-green-500",
      items: [
        { label: "Instância", value: connectedInstance, icon: Server },
        { label: "Status", value: instanceStatus === "connected" ? "Conectado" : instanceStatus === "connecting" ? "Conectando" : "Desconectado", icon: Wifi },
        { label: "EVOLUTION_API_URL", value: "••••••", icon: Globe, sensitive: true },
        { label: "EVOLUTION_API_KEY", value: "••••••", icon: Lock, sensitive: true },
      ],
    },
    {
      title: "Inteligência Artificial",
      icon: Brain,
      description: "Brain Sollaris, IA de Vendas, Geração de conteúdo",
      color: "text-purple-500",
      items: [
        { label: "OPENAI_API_KEY", value: "••••••", icon: Brain, sensitive: true },
        { label: "IA de Vendas", value: aiConfig?.enabled ? "Ativo" : "Inativo", icon: Bot },
        { label: "Perfil IA", value: aiConfig?.scenario_key || "Não definido", icon: Bot },
        { label: "Temperatura", value: aiConfig?.temperature ? String(aiConfig.temperature) : null, icon: Settings },
      ],
    },
    {
      title: "Voz (ElevenLabs)",
      icon: Volume2,
      description: "Text-to-Speech e Speech-to-Text",
      color: "text-pink-500",
      items: [
        { label: "ELEVENLABS_API_KEY", value: "••••••", icon: Mic, sensitive: true },
        { label: "ELEVENLABS_VOICE_ID", value: "••••••", icon: Volume2, sensitive: true },
      ],
    },
    {
      title: "Banco de Dados",
      icon: Database,
      description: "Conexão com o backend",
      color: "text-blue-500",
      items: [
        { label: "SUPABASE_URL", value: "••••••", icon: Globe, sensitive: true },
        { label: "SUPABASE_ANON_KEY", value: "••••••", icon: Lock, sensitive: true },
        { label: "SERVICE_ROLE_KEY", value: "••••••", icon: Shield, sensitive: true },
      ],
    },
  ];

  const totalConfigs = configSections.reduce((s, sec) => s + sec.items.length, 0);
  const configuredCount = configSections.reduce((s, sec) => s + sec.items.filter((i) => i.value && i.value !== "Inativo" && i.value !== "Desconectado" && i.value !== "Não definido" && i.value !== "unknown").length, 0);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ── Mutations (same logic as before) ──
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["settings"] }); toast.success("Configurações salvas!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "create", email: newUser.email, password: newUser.password, full_name: newUser.full_name, cargo: newUser.cargo, role: newUser.role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["system-users"] }); toast.success("Usuário criado!"); setShowNewUser(false); setNewUser({ email: "", password: "", full_name: "", cargo: "", role: "admin" }); },
    onError: (err: any) => toast.error(err.message || "Erro ao criar"),
  });

  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "disable" | "enable" }) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", { body: { action, userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["system-users"] }); toast.success("Status atualizado!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", { body: { action: "delete", userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["system-users"] }); toast.success("Usuário excluído!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!resetPwdUser) return;
      const { data, error } = await supabase.functions.invoke("admin-manage-user", { body: { action: "reset_password", userId: resetPwdUser.id, password: newPassword } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { toast.success("Senha atualizada!"); setResetPwdUser(null); setNewPassword(""); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateCargoMutation = useMutation({
    mutationFn: async () => {
      if (!editingCargoUser) return;
      const { data, error } = await supabase.functions.invoke("admin-manage-user", { body: { action: "update", userId: editingCargoUser.id, cargo: editCargoValue } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["system-users"] }); toast.success("Cargo atualizado!"); setEditingCargoUser(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const checkInstanceStatus = async (name: string) => {
    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("evolution-instance", { body: { action: "status", instanceName: name } });
      if (error) throw error;
      const state = data?.instance?.state || data?.state;
      if (state === "open" || state === "connected") { setInstanceStatus("connected"); setQrCode(null); }
      else if (state === "connecting") setInstanceStatus("connecting");
      else setInstanceStatus("disconnected");
    } catch { setInstanceStatus("unknown"); }
    finally { setIsCheckingStatus(false); }
  };

  const createInstance = async () => {
    if (!instanceName.trim()) { toast.error("Digite o nome da instância"); return; }
    setIsCreating(true); setQrCode(null);
    try {
      const { data, error } = await supabase.functions.invoke("evolution-instance", { body: { action: "create", instanceName: instanceName.trim() } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success("Instância criada!");
      setConnectedInstance(instanceName.trim());
      if (settings) await supabase.from("settings").update({ evolution_instance: instanceName.trim() } as any).eq("id", settings.id);
      if (data?.qrcode) { setQrCode(data.qrcode); setInstanceStatus("connecting"); }
      else await fetchQrCode(instanceName.trim());
    } catch (err: any) { toast.error(err.message || "Erro ao criar"); }
    finally { setIsCreating(false); }
  };

  const fetchQrCode = async (name: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("evolution-instance", { body: { action: "qrcode", instanceName: name } });
      if (error) throw error;
      const base64 = data?.base64 || data?.qrcode?.base64 || data?.code;
      if (base64) { setQrCode(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`); setInstanceStatus("connecting"); }
    } catch {}
  };

  const deleteInstance = async () => {
    if (!connectedInstance) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("evolution-instance", { body: { action: "delete", instanceName: connectedInstance } });
      if (error) throw error;
      toast.success("Instância desconectada");
      setConnectedInstance(null); setInstanceStatus("unknown"); setQrCode(null); setInstanceName("");
      if (settings) await supabase.from("settings").update({ evolution_instance: null } as any).eq("id", settings.id);
    } catch (err: any) { toast.error(err.message || "Erro ao desconectar"); }
    finally { setIsDeleting(false); }
  };

  const getUserDisplayName = (u: SystemUser) => u.full_name || u.email.split("@")[0];
  const isBanned = (u: SystemUser) => u.banned_until ? new Date(u.banned_until) > new Date() : false;
  const uniqueCargos = Array.from(new Set((systemUsers || []).map((u) => u.cargo).filter(Boolean)));
  const filteredUsers = (systemUsers || []).filter((u) => cargoFilter === "all" || u.cargo === cargoFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[900px] space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Visão completa de todas as configurações do sistema</p>
      </div>

      {/* ── CONFIG OVERVIEW ── */}
      <div className="admin-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Status do Sistema</h3>
              <p className="text-[10px] text-muted-foreground">
                {configuredCount}/{totalConfigs} configurações ativas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(configuredCount / totalConfigs) * 100}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round((configuredCount / totalConfigs) * 100)}%</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {configSections.map((section) => {
            const configured = section.items.filter((i) => i.value && i.value !== "Inativo" && i.value !== "Desconectado" && i.value !== "Não definido" && i.value !== "unknown").length;
            const total = section.items.length;
            const allGood = configured === total;
            const isExpanded = expandedSections.has(section.title);

            return (
              <div key={section.title} className="rounded-lg border border-border/60 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-secondary/30 transition-colors"
                >
                  <section.icon className={cn("h-4 w-4", section.color)} />
                  <span className="text-[12px] font-medium flex-1">{section.title}</span>
                  <div className="flex items-center gap-1.5">
                    {allGood ? (
                      <Badge className="text-[8px] bg-green-500/10 text-green-500 border-green-500/20 px-1.5 py-0">
                        <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> OK
                      </Badge>
                    ) : (
                      <Badge className="text-[8px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-1.5 py-0">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> {configured}/{total}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-2.5 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground/60 py-1.5">{section.description}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {section.items.map((item) => {
                        const isOk = item.value && item.value !== "Inativo" && item.value !== "Desconectado" && item.value !== "Não definido" && item.value !== "unknown";
                        return (
                          <div key={item.label} className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px]",
                            isOk ? "bg-green-500/5" : "bg-red-500/5"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", isOk ? "bg-green-500" : "bg-red-500")} />
                            <span className="text-muted-foreground flex-1 truncate">{item.label}</span>
                            <span className={cn("font-medium truncate max-w-[80px]", isOk ? "text-foreground" : "text-red-400")}>
                              {item.sensitive ? (isOk ? "✓ Configurado" : "✗ Ausente") : (item.value || "Não definido")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── USERS MANAGEMENT ── */}
      <div className="admin-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Usuários do Sistema</h3>
              <p className="text-[10px] text-muted-foreground">{systemUsers?.length || 0} usuários registrados</p>
            </div>
          </div>
          <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                  <Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} className="rounded-lg h-9 mt-1" placeholder="Ex: Maria Silva" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="rounded-lg h-9 mt-1" placeholder="usuario@sollaris.com" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Senha</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="rounded-lg h-9 mt-1" placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cargo</Label>
                    <Input value={newUser.cargo} onChange={(e) => setNewUser({ ...newUser, cargo: e.target.value })} className="rounded-lg h-9 mt-1" placeholder="Ex: Vendedora" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Acesso</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                      <SelectTrigger className="rounded-lg h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => createUserMutation.mutate()} className="w-full h-9 text-xs" disabled={createUserMutation.isPending || !newUser.email || !newUser.password || !newUser.full_name}>
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={cargoFilter} onValueChange={setCargoFilter}>
            <SelectTrigger className="w-36 h-7 text-[10px]"><SelectValue placeholder="Filtrar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueCargos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {usersLoading ? (
          <div className="flex justify-center py-6"><div className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase">Nome</TableHead>
                  <TableHead className="text-[10px] uppercase">Email</TableHead>
                  <TableHead className="text-[10px] uppercase">Cargo</TableHead>
                  <TableHead className="text-[10px] uppercase">Status</TableHead>
                  <TableHead className="text-[10px] uppercase text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setResetPwdUser(user)}>
                    <TableCell className="text-xs font-medium">{getUserDisplayName(user)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        {user.cargo || "—"}
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setEditingCargoUser(user); setEditCargoValue(user.cargo || ""); }}>
                          <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isBanned(user) ? (
                        <Badge variant="destructive" className="text-[10px]"><Ban className="h-3 w-3 mr-1" />Desativado</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-green-500/15 text-green-500 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleUserMutation.mutate({ userId: user.id, action: isBanned(user) ? "enable" : "disable" })}>
                          {isBanned(user) ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Ban className="h-3.5 w-3.5 text-destructive" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => { if (confirm(`Excluir ${getUserDisplayName(user)}?`)) deleteUserMutation.mutate(user.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Nenhum usuário</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Reset password dialog */}
      <Dialog open={!!resetPwdUser} onOpenChange={(open) => { if (!open) { setResetPwdUser(null); setNewPassword(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Redefinir Senha</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">Redefinir senha de <strong>{resetPwdUser ? getUserDisplayName(resetPwdUser) : ""}</strong></p>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-lg h-9 mt-1" />
            </div>
            <Button onClick={() => resetPasswordMutation.mutate()} className="w-full h-9 text-xs" disabled={resetPasswordMutation.isPending || !newPassword || newPassword.length < 6}>
              {resetPasswordMutation.isPending ? "Salvando..." : "Atualizar Senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit cargo dialog */}
      <Dialog open={!!editingCargoUser} onOpenChange={(open) => { if (!open) setEditingCargoUser(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Editar Cargo</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">Alterar cargo de <strong>{editingCargoUser ? getUserDisplayName(editingCargoUser) : ""}</strong></p>
            <Input value={editCargoValue} onChange={(e) => setEditCargoValue(e.target.value)} className="rounded-lg h-9" placeholder="Ex: Vendedora, CEO" />
            <Button onClick={() => updateCargoMutation.mutate()} className="w-full h-9 text-xs" disabled={updateCargoMutation.isPending}>
              {updateCargoMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── STORE SETTINGS ── */}
      <div className="admin-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Store className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Configurações da Loja</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome da Loja</Label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-lg h-9 mt-1" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">WhatsApp (DDI)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="rounded-lg h-9 mt-1" placeholder="5511999999999" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Desconto PIX (%)</Label>
            <Input type="number" step="0.5" min="0" max="50" value={pixDiscount} onChange={(e) => setPixDiscount(e.target.value)} className="rounded-lg h-9 mt-1" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Meta Mensal (R$)</Label>
            <Input type="number" step="500" min="0" value={monthlyGoal} onChange={(e) => setMonthlyGoal(e.target.value)} className="rounded-lg h-9 mt-1" />
          </div>
        </div>
        <Button onClick={() => mutation.mutate()} className="w-full h-9 text-xs" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      {/* ── WHATSAPP INSTANCE ── */}
      <div className="admin-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Instância WhatsApp</h3>
              <p className="text-[10px] text-muted-foreground">Evolution API</p>
            </div>
          </div>
          {connectedInstance && (
            <Badge className={cn("text-[10px]",
              instanceStatus === "connected" ? "bg-green-500/15 text-green-400 border-green-500/20" :
              instanceStatus === "connecting" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" :
              "bg-red-500/15 text-red-400 border-red-500/20"
            )}>
              {instanceStatus === "connected" ? <><Wifi className="h-3 w-3 mr-1" /> Conectado</> :
               instanceStatus === "connecting" ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Conectando</> :
               <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>}
            </Badge>
          )}
        </div>

        {!connectedInstance ? (
          <>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome da Instância</Label>
              <Input value={instanceName} onChange={(e) => setInstanceName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} className="rounded-lg h-9 mt-1" placeholder="sollaris-principal" />
            </div>
            <Button onClick={createInstance} className="w-full h-9 text-xs bg-green-600 hover:bg-green-700" disabled={isCreating || !instanceName.trim()}>
              {isCreating ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Criando...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" /> Criar e Conectar</>}
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
                <div className="bg-white p-3 rounded-xl"><img src={qrCode} alt="QR Code" className="w-48 h-48 object-contain" /></div>
                <p className="text-[11px] text-muted-foreground text-center">WhatsApp → Aparelhos conectados → Escanear</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => checkInstanceStatus(connectedInstance)} disabled={isCheckingStatus}>
                <RefreshCw className={cn("h-3 w-3 mr-1", isCheckingStatus && "animate-spin")} /> Status
              </Button>
              {instanceStatus !== "connected" && (
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => fetchQrCode(connectedInstance)}>
                  <QrCode className="h-3 w-3 mr-1" /> QR Code
                </Button>
              )}
              <Button variant="destructive" size="sm" className="text-xs h-8" onClick={deleteInstance} disabled={isDeleting}>
                {isDeleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── GOOGLE SHEETS INTEGRATION ── */}
      <GoogleSheetsConnection />
    </div>
  );
};

export default AdminSettings;
