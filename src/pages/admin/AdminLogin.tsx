import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Store, Lock } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão inválida.");
      const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
        _user_id: userId, _role: "admin",
      });
      if (roleError || !isAdmin) {
        await signOut();
        throw new Error("Acesso não autorizado.");
      }
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Store className="h-6 w-6 text-accent" />
          </div>
          <h1 className="font-serif text-xl tracking-[0.2em]">SOLLARIS</h1>
          <div className="gold-line w-10 mx-auto my-3" />
          <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase font-medium">Painel Administrativo</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg h-10 mt-1" required />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg h-10 mt-1" required />
            </div>
            <Button type="submit" className="w-full rounded-lg h-10 gap-2" disabled={loading}>
              <Lock className="h-3.5 w-3.5" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
