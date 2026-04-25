import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, Sparkles, Gift, MessageCircle, Crown,
  Copy, Check, ArrowRight, Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link as RouterLink } from "react-router-dom";

interface SuccessState {
  orderId?: string;
  paymentId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  total?: number;
  paymentMethod?: "pix" | "cartao";
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  foto_frontal: string | null;
}

const formatPrice = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const generateCouponCode = () => {
  const seed = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `VOLTA10-${seed}`;
};

const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { clearCart } = useCart();
  const state = (location.state || {}) as SuccessState;

  const paymentId = state.paymentId || params.get("payment_id") || "";
  const orderId = state.orderId || params.get("order_id") || "";

  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [coupon] = useState(generateCouponCode());
  const [couponCopied, setCouponCopied] = useState(false);

  // Form opt-in opcional
  const [showExtraForm, setShowExtraForm] = useState(true);
  const [extraSubmitted, setExtraSubmitted] = useState(false);
  const [extra, setExtra] = useState({
    cpf: "",
    full_address: "",
    birthday: "",
    wants_vip: true,
  });

  // Confetti champagne discreto ao montar
  useEffect(() => {
    clearCart();
    const t = setTimeout(() => {
      const colors = ["#c89b3c", "#e2c275", "#f4dca8", "#ffffff"];
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.32 },
        colors,
        scalar: 0.9,
        ticks: 220,
      });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 100,
          origin: { y: 0.45, x: 0.2 },
          colors,
          scalar: 0.8,
          ticks: 180,
        });
        confetti({
          particleCount: 40,
          spread: 100,
          origin: { y: 0.45, x: 0.8 },
          colors,
          scalar: 0.8,
          ticks: 180,
        });
      }, 250);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega 4 produtos relacionados (outros featured ou recentes)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, images, foto_frontal")
        .eq("stock_status", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (data) {
        // Pega 4 aleatórios dos 8 mais featured/recentes
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 4);
        setRelated(shuffled);
      }
    })();
  }, []);

  const handleCopyCoupon = async () => {
    await navigator.clipboard.writeText(coupon);
    setCouponCopied(true);
    toast.success("Cupom copiado!");
    setTimeout(() => setCouponCopied(false), 2000);
  };

  const handleExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extra.cpf && !extra.full_address && !extra.birthday && !extra.wants_vip) {
      toast.info("Preencha pelo menos um campo para enviar.");
      return;
    }
    try {
      const { error } = await (supabase.from("customer_extra_info") as any).insert({
        order_id: orderId || null,
        customer_phone: state.customerPhone || null,
        customer_email: state.customerEmail || null,
        cpf: extra.cpf || null,
        full_address: extra.full_address || null,
        birthday: extra.birthday || null,
        wants_vip: extra.wants_vip,
      });
      if (error) throw error;
      setExtraSubmitted(true);
      toast.success("Obrigada! Seus dados foram salvos.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar. Tente novamente.");
    }
  };

  const handleVipWhatsApp = () => {
    const msg = `Oi! Acabei de comprar na Sollaris${state.customerName ? ` (${state.customerName})` : ""} e quero entrar no Clube VIP 💎`;
    window.open(
      `https://wa.me/5512991895250?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const isPix = state.paymentMethod === "pix";

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">

        {/* ════════ HERO · confirmação ════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 18 }}
            className="relative inline-flex"
          >
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-3xl scale-150" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/30 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-accent" strokeWidth={1.4} />
            </div>
          </motion.div>

          <div className="space-y-3">
            <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-accent">
              Pedido confirmado
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-foreground leading-tight tracking-tight">
              Obrigada,<br />
              <span className="italic">
                {state.customerName ? state.customerName.split(" ")[0] : "querida"}
              </span>
            </h1>
            <p className="font-sans text-[14px] text-muted-foreground max-w-md mx-auto leading-relaxed">
              {isPix
                ? "Recebemos seu Pix. Sua peça já está sendo preparada com cuidado."
                : "Seu pagamento foi aprovado. Sua peça já está sendo preparada com cuidado."}
            </p>
          </div>

          {/* Order ID */}
          {(orderId || paymentId) && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border">
              <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Pedido
              </span>
              <span className="font-mono text-[11px] text-foreground tracking-wider">
                #{(orderId || paymentId).slice(0, 8).toUpperCase()}
              </span>
              {state.total && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="font-sans text-[12px] text-foreground tabular-nums">
                    {formatPrice(state.total)}
                  </span>
                </>
              )}
            </div>
          )}
        </motion.section>

        {/* ════════ CUPOM DE RETORNO ════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/8 via-card to-card p-6 sm:p-8"
        >
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center flex-shrink-0">
              <Gift className="h-6 w-6 text-accent-foreground" strokeWidth={1.6} />
            </div>
            <div className="flex-1 space-y-2">
              <p className="font-sans text-[10px] tracking-[0.24em] uppercase text-accent">
                Um mimo pra próxima
              </p>
              <h3 className="font-serif text-2xl text-foreground leading-tight">
                10% de desconto na sua próxima compra
              </h3>
              <p className="text-[13px] text-muted-foreground">
                Use o cupom abaixo no checkout. Válido por 30 dias.
              </p>
              <button
                onClick={handleCopyCoupon}
                className="mt-3 group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background font-mono text-[13px] tracking-widest hover:bg-foreground/90 transition-all"
              >
                {coupon}
                <span className="ml-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  {couponCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* ════════ PRODUTOS RELACIONADOS ════════ */}
        {related.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-sans text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
                  Curadoria
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl text-foreground tracking-tight">
                  Você também vai amar
                </h2>
              </div>
              <Link
                to="/colecao"
                className="hidden sm:inline-flex items-center gap-1.5 font-sans text-[11px] tracking-[0.18em] uppercase text-muted-foreground hover:text-accent transition-colors"
              >
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p, i) => {
                const img = p.foto_frontal || p.images?.[0] || "/placeholder.svg";
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                  >
                    <RouterLink
                      to={`/produto/${p.id}`}
                      className="block group"
                    >
                      <div className="aspect-square overflow-hidden bg-secondary rounded-2xl mb-2.5">
                        <img
                          src={img}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <p className="font-sans text-[12px] text-foreground line-clamp-1 leading-tight">
                        {p.name}
                      </p>
                      <p className="font-sans text-[12px] text-accent mt-0.5 tabular-nums">
                        {formatPrice(p.price)}
                      </p>
                    </RouterLink>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ════════ FORM OPCIONAL · dados extras ════════ */}
        <AnimatePresence>
          {showExtraForm && !extraSubmitted && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-sans text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
                    Opcional · 30 segundos
                  </p>
                  <h3 className="font-serif text-xl text-foreground">
                    Receba seu pedido mais rápido
                  </h3>
                  <p className="text-[12px] text-muted-foreground max-w-md">
                    Adicione dados para agilizar o envio e ganhar um mimo no seu aniversário.
                  </p>
                </div>
                <button
                  onClick={() => setShowExtraForm(false)}
                  className="font-sans text-[11px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  Pular
                </button>
              </div>

              <form onSubmit={handleExtraSubmit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <ExtraField
                    label="CPF (nota fiscal)"
                    value={extra.cpf}
                    onChange={(v) => setExtra({ ...extra, cpf: maskCPF(v) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  <ExtraField
                    label="Aniversário"
                    type="date"
                    value={extra.birthday}
                    onChange={(v) => setExtra({ ...extra, birthday: v })}
                  />
                </div>
                <ExtraField
                  label="Endereço completo"
                  value={extra.full_address}
                  onChange={(v) => setExtra({ ...extra, full_address: v })}
                  placeholder="Rua, número, bairro, cidade, CEP"
                />

                <label className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border cursor-pointer hover:bg-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={extra.wants_vip}
                    onChange={(e) => setExtra({ ...extra, wants_vip: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                  />
                  <div className="flex-1">
                    <p className="font-sans text-[13px] text-foreground font-medium">
                      Quero entrar no Clube VIP Sollaris
                    </p>
                    <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                      Acesso antecipado a coleções, peças exclusivas e descontos privados.
                    </p>
                  </div>
                </label>

                <button
                  type="submit"
                  className="w-full h-12 mt-2 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.22em] uppercase rounded-full hover:bg-accent/90 active:scale-[0.985] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Salvar dados
                </button>
              </form>
            </motion.section>
          )}

          {extraSubmitted && (
            <motion.section
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-accent/30 bg-accent/5 p-6 text-center space-y-2"
            >
              <CheckCircle2 className="h-8 w-8 text-accent mx-auto" strokeWidth={1.5} />
              <p className="font-serif text-lg text-foreground">Obrigada!</p>
              <p className="text-[12px] text-muted-foreground">
                Seus dados estão salvos. Aguarde nosso contato.
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ════════ CONVITE VIP / WHATSAPP ════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-foreground text-background p-6 sm:p-8"
        >
          <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-accent/20 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
              <Crown className="h-5 w-5 text-accent" strokeWidth={1.6} />
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <p className="font-sans text-[10px] tracking-[0.24em] uppercase text-accent">
                  Clube VIP Sollaris
                </p>
                <h3 className="font-serif text-2xl text-background leading-tight">
                  Curadoria privada, antes de todo mundo
                </h3>
                <p className="text-[13px] text-background/70 leading-relaxed max-w-md">
                  Atendimento exclusivo via WhatsApp, lançamentos em primeira mão e peças que não chegam à vitrine.
                </p>
              </div>
              <button
                onClick={handleVipWhatsApp}
                className="inline-flex items-center gap-2 h-11 px-6 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.22em] uppercase rounded-full hover:bg-accent/90 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Entrar via WhatsApp
              </button>
            </div>
          </div>
        </motion.section>

        {/* ════════ AÇÕES FINAIS ════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 pt-4"
        >
          <Link
            to="/colecao"
            className="flex-1 h-13 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.24em] uppercase rounded-full flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors"
          >
            Continuar comprando
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/"
            className="flex-1 h-13 border border-border text-foreground font-sans text-[11px] tracking-[0.24em] uppercase rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            Voltar à vitrine
          </Link>
        </motion.div>

        {/* Footer signature */}
        <div className="text-center pt-6 pb-4 flex items-center justify-center gap-1.5 text-muted-foreground/50">
          <Heart className="h-3 w-3" />
          <span className="font-sans text-[10px] tracking-[0.3em] uppercase">
            Sollaris · feito com cuidado
          </span>
        </div>
      </div>
    </div>
  );
};

const ExtraField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) => (
  <div>
    <label className="block font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground/80 mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-4 rounded-xl bg-secondary/70 border border-border/60 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/60 focus:bg-card focus:ring-2 focus:ring-accent/15 transition-all"
    />
  </div>
);

const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export default CheckoutSuccessPage;
