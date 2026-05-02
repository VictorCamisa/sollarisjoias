import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import SollarisSeal from "@/components/store/SollarisSeal";

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Nome muito curto").max(100),
});

const AuthPage = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  const redirectTo = (location.state as any)?.from || "/conta";

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const parsed = signInSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        await signIn(parsed.data.email, parsed.data.password);
        toast.success("Bem-vinda de volta ✨");
      } else {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName);
        toast.success("Conta criada com sucesso ✨");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Erro inesperado";
      if (msg.includes("Invalid login")) toast.error("Email ou senha incorretos");
      else if (msg.includes("already registered") || msg.includes("already been registered"))
        toast.error("Este email já está cadastrado. Faça login.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <SollarisSeal size={40} tone="bordeaux" />
            <span className="font-display text-[18px] tracking-[0.3em] text-bordeaux">SOLLARIS</span>
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-foreground mb-2">
            {mode === "signin" ? "Bem-vinda de volta" : "Criar conta"}
          </h1>
          <p className="font-sans text-foreground/65 text-sm">
            {mode === "signin"
              ? "Acesse sua conta para acompanhar pedidos e endereços salvos."
              : "Cadastre-se para uma experiência personalizada na Maison."}
          </p>
        </div>

        <div className="bg-card border border-border p-7 sm:p-9">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65 mb-2 block">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-2.5 text-foreground focus:outline-none focus:border-bordeaux transition-colors text-sm"
                />
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65 mb-2 block">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-background border border-border px-4 py-2.5 text-foreground focus:outline-none focus:border-bordeaux transition-colors text-sm"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65 mb-2 block">
                Senha
              </label>
              <input
                type="password"
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-background border border-border px-4 py-2.5 text-foreground focus:outline-none focus:border-bordeaux transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bordeaux text-maison-creme font-mono text-[11px] uppercase tracking-[0.22em] py-3.5 hover:bg-maison-bordeaux-deep transition-colors disabled:opacity-60"
            >
              {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/65 hover:text-bordeaux transition-colors"
            >
              {mode === "signin"
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Entrar"}
            </button>
          </div>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50 hover:text-bordeaux">
            ← Voltar à loja
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
