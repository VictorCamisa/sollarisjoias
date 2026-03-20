import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Store, Lock, ArrowRight } from "lucide-react";

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[360px]"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5"
          >
            <Store className="h-7 w-7 text-accent" />
          </motion.div>
          <h1 className="font-serif text-xl tracking-[0.2em] text-foreground">SOLLARIS</h1>
          <div className="gold-line w-12 mx-auto my-3" />
          <p className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase font-medium">
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="admin-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="admin-section-label mb-1.5 block">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input" required
                placeholder="admin@sollaris.com"
              />
            </div>
            <div>
              <Label className="admin-section-label mb-1.5 block">Senha</Label>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input" required
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 gap-2 rounded-lg font-medium text-sm mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Acessar Painel
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-6 tracking-wider">
          Acesso restrito a administradores
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
