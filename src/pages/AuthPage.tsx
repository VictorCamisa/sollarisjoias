import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import SollarisSeal from "@/components/store/SollarisSeal";
import { lovable } from "@/integrations/lovable";

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
          <button
            type="button"
            onClick={async () => {
              try {
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin + "/conta",
                });
                if (result.error) {
                  toast.error("Não foi possível entrar com Google");
                  return;
                }
              } catch {
                toast.error("Erro ao conectar com Google");
              }
            }}
            className="w-full flex items-center justify-center gap-3 bg-background border border-border py-3 text-foreground hover:border-bordeaux transition-colors mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
              Continuar com Google
            </span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/50">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

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
