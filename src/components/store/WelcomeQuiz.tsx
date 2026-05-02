import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Copy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STORAGE_KEY = "sollaris_welcome_quiz_v1";
const COUPON = "BEMVINDA10";

type Step = "intro" | "occasion" | "style" | "category" | "budget" | "contact" | "reward";

interface QuizData {
  occasion?: string;
  style?: string;
  category?: string;
  budget?: string;
  name?: string;
  email?: string;
  whatsapp?: string;
}

const OCCASIONS = ["Para mim", "Presente", "Data especial", "Sem ocasião"];
const STYLES = ["Minimalista", "Statement", "Clássico", "Moderno"];
const CATEGORIES = ["Anéis", "Brincos", "Colares", "Pulseiras", "Tudo"];
const BUDGETS = ["Até R$ 200", "R$ 200–500", "R$ 500–1.000", "Acima de R$ 1.000"];

export default function WelcomeQuiz() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [data, setData] = useState<QuizData>({});
  const [submitting, setSubmitting] = useState(false);

  // Trigger: aparece após 6s na primeira visita; nunca em /admin nem /auth
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/auth") || path.startsWith("/checkout")) return;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;

    const t = window.setTimeout(() => setOpen(true), 6000);
    return () => window.clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
  };

  const submit = async () => {
    if (!data.email || !data.email.includes("@")) {
      toast.error("E-mail inválido");
      return;
    }
    setSubmitting(true);
    try {
      const params = new URLSearchParams(window.location.search);
      await supabase.from("welcome_quiz_responses").insert({
        user_id: user?.id ?? null,
        session_id: localStorage.getItem("sollaris_session_id"),
        name: data.name ?? null,
        email: data.email,
        whatsapp: data.whatsapp ?? null,
        occasion: data.occasion ?? null,
        style_preference: data.style ?? null,
        category_interest: data.category ?? null,
        budget_range: data.budget ?? null,
        coupon_code: COUPON,
        source_url: window.location.pathname,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
      });

      // Newsletter (não-bloqueante)
      supabase.from("newsletter_subscribers")
        .insert({ email: data.email, name: data.name ?? null })
        .then(() => {});

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedAt: Date.now(), email: data.email }));
      setStep("reward");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(COUPON);
      toast.success("Cupom copiado");
    } catch {
      toast.error("Copie manualmente: " + COUPON);
    }
  };

  const next = (k: keyof QuizData, v: string, nextStep: Step) => {
    setData((d) => ({ ...d, [k]: v }));
    setStep(nextStep);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-[hsl(var(--sollaris-obsidiana))]/85 backdrop-blur-sm p-0 sm:p-6"
          onClick={close}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-[460px] bg-[hsl(var(--sollaris-obsidiana))] text-white border border-[hsl(var(--maison-gold)/0.35)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]"
          >
            <button
              onClick={close}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-10 text-white/50 hover:text-[hsl(var(--maison-gold))] transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.2} />
            </button>

            {/* Filete dourado superior */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--maison-gold))] to-transparent" />

            <div className="px-7 sm:px-10 py-8 sm:py-10 min-h-[420px] flex flex-col">
              {/* Eyebrow */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="h-px w-6 bg-[hsl(var(--maison-gold))]/60" />
                <span className="text-[10px] tracking-[0.4em] uppercase text-[hsl(var(--maison-gold))]">
                  Sollaris · Convite
                </span>
                <span className="h-px w-6 bg-[hsl(var(--maison-gold))]/60" />
              </div>

              {/* Progresso */}
              {step !== "intro" && step !== "reward" && (
                <ProgressBar step={step} />
              )}

              {step === "intro" && (
                <Step
                  title="Um cupom de boas-vindas"
                  subtitle="Conte-nos um pouco sobre você. Em troca, oferecemos 10% de desconto na sua primeira compra — feita à mão para o seu estilo."
                  cta="Começar (60s)"
                  onCta={() => setStep("occasion")}
                  secondary={{ label: "Agora não", onClick: close }}
                />
              )}

              {step === "occasion" && (
                <ChoiceStep
                  title="Para qual ocasião?"
                  options={OCCASIONS}
                  onPick={(v) => next("occasion", v, "style")}
                />
              )}

              {step === "style" && (
                <ChoiceStep
                  title="Qual estilo combina com você?"
                  options={STYLES}
                  onPick={(v) => next("style", v, "category")}
                />
              )}

              {step === "category" && (
                <ChoiceStep
                  title="O que mais te encanta?"
                  options={CATEGORIES}
                  onPick={(v) => next("category", v, "budget")}
                />
              )}

              {step === "budget" && (
                <ChoiceStep
                  title="Faixa de investimento"
                  options={BUDGETS}
                  onPick={(v) => next("budget", v, "contact")}
                />
              )}

              {step === "contact" && (
                <div className="flex-1 flex flex-col">
                  <h3 className="font-serif text-2xl sm:text-3xl text-white text-center leading-tight mb-2">
                    Quase lá
                  </h3>
                  <p className="text-[12px] tracking-wide text-white/60 text-center mb-6">
                    Onde devemos enviar seu cupom?
                  </p>
                  <div className="space-y-3 flex-1">
                    <FieldInput
                      placeholder="Seu nome"
                      value={data.name ?? ""}
                      onChange={(v) => setData((d) => ({ ...d, name: v }))}
                    />
                    <FieldInput
                      placeholder="E-mail"
                      type="email"
                      value={data.email ?? ""}
                      onChange={(v) => setData((d) => ({ ...d, email: v }))}
                    />
                    <FieldInput
                      placeholder="WhatsApp (opcional)"
                      value={data.whatsapp ?? ""}
                      onChange={(v) => setData((d) => ({ ...d, whatsapp: v }))}
                    />
                  </div>
                  <button
                    disabled={submitting}
                    onClick={submit}
                    className="mt-6 w-full py-3.5 bg-[hsl(var(--maison-bordeaux))] hover:bg-[hsl(var(--maison-bordeaux-deep))] text-white text-[11px] tracking-[0.3em] uppercase transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Enviando…" : "Receber meu cupom"}
                  </button>
                  <p className="text-[10px] text-white/40 text-center mt-3 tracking-wide">
                    Sem spam. Cancele quando quiser.
                  </p>
                </div>
              )}

              {step === "reward" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full border border-[hsl(var(--maison-gold))]/60 flex items-center justify-center mb-5">
                    <Sparkles className="w-5 h-5 text-[hsl(var(--maison-gold))]" strokeWidth={1.2} />
                  </div>
                  <h3 className="font-serif text-3xl text-white leading-tight mb-2">
                    Bem-vinda à Maison
                  </h3>
                  <p className="text-[12px] tracking-wide text-white/60 mb-6 max-w-[320px]">
                    Use o cupom abaixo no checkout e ganhe 10% de desconto.
                  </p>
                  <button
                    onClick={copyCoupon}
                    className="group flex items-center gap-3 px-6 py-4 border border-[hsl(var(--maison-gold))] text-[hsl(var(--maison-gold))] hover:bg-[hsl(var(--maison-gold))] hover:text-[hsl(var(--sollaris-obsidiana))] transition-colors"
                  >
                    <span className="font-serif text-2xl tracking-[0.3em]">{COUPON}</span>
                    <Copy className="w-4 h-4" strokeWidth={1.2} />
                  </button>
                  <button
                    onClick={close}
                    className="mt-6 text-[10px] tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors"
                  >
                    Continuar navegando
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────── Sub-componentes ───────── */

function Step({
  title,
  subtitle,
  cta,
  onCta,
  secondary,
}: {
  title: string;
  subtitle: string;
  cta: string;
  onCta: () => void;
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <h3 className="font-serif text-3xl sm:text-[34px] text-white leading-[1.15] mb-4 max-w-[340px]">
        {title}
      </h3>
      <p className="text-[13px] leading-relaxed text-white/65 max-w-[340px] mb-8">
        {subtitle}
      </p>
      <button
        onClick={onCta}
        className="px-8 py-3.5 bg-[hsl(var(--maison-bordeaux))] hover:bg-[hsl(var(--maison-bordeaux-deep))] text-white text-[11px] tracking-[0.3em] uppercase transition-colors"
      >
        {cta}
      </button>
      {secondary && (
        <button
          onClick={secondary.onClick}
          className="mt-4 text-[10px] tracking-[0.3em] uppercase text-white/45 hover:text-white transition-colors"
        >
          {secondary.label}
        </button>
      )}
    </div>
  );
}

function ChoiceStep({
  title,
  options,
  onPick,
}: {
  title: string;
  options: string[];
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h3 className="font-serif text-2xl sm:text-[26px] text-white text-center leading-tight mb-6">
        {title}
      </h3>
      <div className="space-y-2.5 flex-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onPick(opt)}
            className="group w-full flex items-center justify-between px-5 py-3.5 border border-white/15 hover:border-[hsl(var(--maison-gold))] hover:bg-white/[0.03] transition-all text-left"
          >
            <span className="text-[13px] tracking-wide text-white/85 group-hover:text-white">
              {opt}
            </span>
            <Check
              className="w-4 h-4 text-[hsl(var(--maison-gold))] opacity-0 group-hover:opacity-100 transition-opacity"
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldInput({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3.5 bg-transparent border border-white/15 focus:border-[hsl(var(--maison-gold))] focus:outline-none text-[13px] text-white placeholder:text-white/35 tracking-wide transition-colors"
    />
  );
}

function ProgressBar({ step }: { step: Step }) {
  const order: Step[] = ["occasion", "style", "category", "budget", "contact"];
  const idx = order.indexOf(step);
  const pct = ((idx + 1) / order.length) * 100;
  return (
    <div className="mb-6">
      <div className="h-px bg-white/10 relative overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 left-0 bg-[hsl(var(--maison-gold))]"
        />
      </div>
      <div className="text-[9px] tracking-[0.3em] uppercase text-white/40 mt-2 text-right">
        {idx + 1} / {order.length}
      </div>
    </div>
  );
}
