import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Loader2, CheckCircle2, AlertCircle, Copy, Check,
  ShieldCheck, QrCode, CreditCard, Lock, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

interface CheckoutItem {
  id?: string;
  title: string;
  quantity: number;
  unit_price: number;
  picture_url?: string;
}

interface CheckoutCustomerInfo {
  name: string;
  email: string;
  phone?: string;
  paymentMethod: "pix" | "cartao";
  paymentStatus: "paid" | "pending";
  installments?: number;
}

interface NativeCheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  items: CheckoutItem[];
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderId?: string;
  onSuccess?: (paymentId: string, customer?: CheckoutCustomerInfo) => void;
}

type Tab = "pix" | "card";
type Phase = "form" | "processing" | "pix-pending" | "approved" | "rejected";

const SDK_URL = "https://sdk.mercadopago.com/js/v2";

const formatPrice = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const loadMpSdk = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha SDK MP")));
      return;
    }
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar SDK MP"));
    document.head.appendChild(s);
  });

const NativeCheckoutDialog = ({
  open,
  onClose,
  items,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  orderId,
  onSuccess,
}: NativeCheckoutDialogProps) => {
  const [tab, setTab] = useState<Tab>("pix");
  const [phase, setPhase] = useState<Phase>("form");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_base64: string;
    payment_id: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number>(30 * 60);

  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardholderName: "",
    expiry: "",
    cvv: "",
    cpf: "",
    email: customerEmail || "",
    installments: 1,
  });

  const [pixForm, setPixForm] = useState({
    cpf: "",
    email: customerEmail || "",
    name: customerName || "",
  });

  const mpRef = useRef<any>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab("pix");
    setPhase("form");
    setErrorMsg(null);
    setPixData(null);
    setCopied(false);
    setCountdown(30 * 60);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("mercadopago-public-key");
        if (error || !data?.public_key) throw new Error("Public key MP indisponível");
        await loadMpSdk();
        mpRef.current = new window.MercadoPago(data.public_key, { locale: "pt-BR" });
      } catch (err) {
        console.error("MP SDK init:", err);
        setErrorMsg("Erro ao inicializar checkout. Tente novamente.");
      }
    })();
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (phase !== "pix-pending") return;
    const t = window.setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "pix-pending" || !pixData?.payment_id) return;
    const check = async () => {
      const { data } = await supabase
        .from("pix_transactions")
        .select("status")
        .eq("mp_payment_id", pixData.payment_id)
        .maybeSingle();
      if (data?.status === "paid") {
        setPhase("approved");
        onSuccess?.(pixData.payment_id, {
          name: pixForm.name,
          email: pixForm.email,
          phone: customerPhone,
          paymentMethod: "pix",
          paymentStatus: "paid",
          installments: 1,
        });
      } else if (data?.status === "cancelled") {
        setPhase("rejected");
        setErrorMsg("Pagamento cancelado ou expirado");
      }
    };
    pollRef.current = window.setInterval(check, 4000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [phase, pixData, onSuccess]);

  const fmtCountdown = () => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const cleanDigits = (s: string) => s.replace(/\D/g, "");

  const handleCopyPix = async () => {
    if (!pixData?.qr_code) return;
    await navigator.clipboard.writeText(pixData.qr_code);
    setCopied(true);
    toast.success("Código Pix copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const submitPix = async () => {
    setErrorMsg(null);
    const cpf = cleanDigits(pixForm.cpf);
    if (cpf.length !== 11) return setErrorMsg("CPF inválido");
    if (!pixForm.email.includes("@")) return setErrorMsg("E-mail inválido");
    if (!pixForm.name.trim()) return setErrorMsg("Nome obrigatório");

    setPhase("processing");
    try {
      const [first, ...rest] = pixForm.name.trim().split(" ");
      const { data, error } = await supabase.functions.invoke("mercadopago-process-payment", {
        body: {
          formData: {
            payment_method_id: "pix",
            transaction_amount: Number(amount.toFixed(2)),
            payer: {
              email: pixForm.email,
              first_name: first,
              last_name: rest.join(" ") || "Sollaris",
              identification: { type: "CPF", number: cpf },
            },
          },
          description: `Pedido Sollaris (${items.length} itens)`,
          order_id: orderId,
          customer_name: pixForm.name,
          customer_phone: customerPhone,
          items,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.qr_code && data?.qr_code_base64) {
        setPixData({
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          payment_id: String(data.payment_id),
        });
        setPhase("pix-pending");
      } else {
        throw new Error("QR Code não gerado");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar Pix";
      setErrorMsg(msg);
      setPhase("form");
    }
  };

  const submitCard = async () => {
    setErrorMsg(null);
    const num = cleanDigits(cardForm.cardNumber);
    const cpf = cleanDigits(cardForm.cpf);
    const cvv = cleanDigits(cardForm.cvv);
    const [mm, yy] = cardForm.expiry.split("/").map((s) => s.trim());

    if (num.length < 13) return setErrorMsg("Número do cartão inválido");
    if (!cardForm.cardholderName.trim()) return setErrorMsg("Nome no cartão obrigatório");
    if (!mm || !yy || mm.length !== 2 || yy.length < 2) return setErrorMsg("Validade inválida (MM/AA)");
    if (cvv.length < 3) return setErrorMsg("CVV inválido");
    if (cpf.length !== 11) return setErrorMsg("CPF inválido");
    if (!cardForm.email.includes("@")) return setErrorMsg("E-mail inválido");
    if (!mpRef.current) return setErrorMsg("SDK não carregado");

    setPhase("processing");
    try {
      const fullYear = yy.length === 2 ? `20${yy}` : yy;
      const tokenResp = await mpRef.current.createCardToken({
        cardNumber: num,
        cardholderName: cardForm.cardholderName,
        cardExpirationMonth: mm,
        cardExpirationYear: fullYear,
        securityCode: cvv,
        identificationType: "CPF",
        identificationNumber: cpf,
      });

      if (!tokenResp?.id) throw new Error("Falha ao tokenizar cartão");

      const bin = num.substring(0, 8);
      const methods = await mpRef.current.getPaymentMethods({ bin });
      const paymentMethodId = methods?.results?.[0]?.id || "visa";

      const { data, error } = await supabase.functions.invoke("mercadopago-process-payment", {
        body: {
          formData: {
            token: tokenResp.id,
            payment_method_id: paymentMethodId,
            transaction_amount: Number(amount.toFixed(2)),
            installments: cardForm.installments,
            payer: {
              email: cardForm.email,
              identification: { type: "CPF", number: cpf },
            },
          },
          description: `Pedido Sollaris (${items.length} itens)`,
          order_id: orderId,
          customer_name: cardForm.cardholderName,
          customer_phone: customerPhone,
          items,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.status === "approved") {
        setPhase("approved");
        onSuccess?.(String(data.payment_id), {
          name: cardForm.cardholderName,
          email: cardForm.email,
          phone: customerPhone,
          paymentMethod: "cartao",
          paymentStatus: "paid",
          installments: cardForm.installments,
        });
      } else if (data?.status === "rejected") {
        setPhase("rejected");
        setErrorMsg(data?.status_detail || "Pagamento recusado pela operadora");
      } else {
        setPhase("rejected");
        setErrorMsg("Pagamento pendente. Aguarde confirmação.");
      }
    } catch (err: any) {
      const msg = err?.message || err?.cause?.[0]?.description || "Erro ao processar cartão";
      setErrorMsg(msg);
      setPhase("form");
    }
  };

  const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // Animations
  const fadeSlide = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as any },
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={phase === "form" || phase === "rejected" ? onClose : undefined}
            className="absolute inset-0 bg-sollaris-obsidiana/85 backdrop-blur-xl"
          />

          {/* Modal — full-screen mobile, centered desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="
              relative w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-[440px]
              bg-card sm:rounded-3xl
              flex flex-col overflow-hidden
              shadow-[0_40px_120px_-20px_rgba(0,0,0,0.45)]
              border border-border/40
            "
          >
            {/* ════════ HEADER · brand bar ════════ */}
            <div className="relative px-6 pt-6 pb-5 border-b border-border/60 flex-shrink-0 bg-gradient-to-b from-card to-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-sans text-[9px] tracking-[0.32em] uppercase text-muted-foreground/70">
                    Sollaris · Checkout
                  </p>
                  <h2 className="font-serif text-[22px] leading-tight text-foreground mt-1.5">
                    {phase === "approved" ? "Pedido confirmado" :
                      phase === "pix-pending" ? "Quase lá" :
                      phase === "processing" ? "Processando" :
                      phase === "rejected" ? "Tentar novamente" :
                      "Finalizar pagamento"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={phase === "processing"}
                  aria-label="Fechar"
                  className="
                    -mr-2 -mt-2 w-9 h-9 rounded-full flex items-center justify-center
                    text-muted-foreground hover:text-foreground hover:bg-secondary
                    transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  "
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Total visível sempre */}
              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
                  Total a pagar
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-[28px] leading-none text-foreground tracking-tight">
                    {formatPrice(amount)}
                  </span>
                </div>
              </div>

              {/* Progress micro-bar */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-border overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width:
                      phase === "form" ? "33%" :
                      phase === "processing" ? "66%" :
                      phase === "pix-pending" ? "66%" :
                      "100%"
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-accent"
                />
              </div>
            </div>

            {/* ════════ BODY ════════ */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Tabs Pix/Cartão */}
              {phase === "form" && (
                <div className="px-6 pt-5">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/60 rounded-2xl">
                    {([
                      { k: "pix" as Tab, icon: QrCode, label: "Pix", hint: "instantâneo" },
                      { k: "card" as Tab, icon: CreditCard, label: "Cartão", hint: "até 12x" },
                    ]).map(({ k, icon: Icon, label, hint }) => {
                      const active = tab === k;
                      return (
                        <button
                          key={k}
                          onClick={() => setTab(k)}
                          className={`
                            relative flex flex-col items-center gap-1 py-3 rounded-xl
                            transition-all duration-200
                            ${active
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"}
                          `}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                          <span className="font-sans text-[12px] font-medium">{label}</span>
                          <span className="font-sans text-[9px] tracking-[0.15em] uppercase opacity-60">
                            {hint}
                          </span>
                          {active && (
                            <motion.span
                              layoutId="tab-glow"
                              className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-px bg-accent"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="px-6 py-5">
                {/* Erro inline */}
                <AnimatePresence>
                  {errorMsg && phase !== "approved" && phase !== "rejected" && (
                    <motion.div
                      {...fadeSlide}
                      className="mb-4 p-3 rounded-xl border border-destructive/30 bg-destructive/10 flex gap-2.5 items-start"
                    >
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-destructive leading-snug">{errorMsg}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {/* PROCESSANDO */}
                  {phase === "processing" && (
                    <motion.div
                      key="processing"
                      {...fadeSlide}
                      className="py-16 flex flex-col items-center gap-5"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
                        <div className="relative w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-accent animate-spin" />
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-serif text-base text-foreground">
                          Processando seu pagamento
                        </p>
                        <p className="font-sans text-[12px] text-muted-foreground">
                          Não feche esta janela
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* APROVADO */}
                  {phase === "approved" && (
                    <motion.div
                      key="approved"
                      {...fadeSlide}
                      className="py-10 flex flex-col items-center gap-5 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 18 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 rounded-full bg-accent/15 blur-2xl scale-150" />
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/30">
                          <CheckCircle2 className="h-10 w-10 text-accent" strokeWidth={1.5} />
                        </div>
                      </motion.div>
                      <div className="space-y-2 max-w-xs">
                        <h3 className="font-serif text-2xl text-foreground">Tudo certo</h3>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                          Seu pedido foi confirmado. Você será redirecionada em instantes.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="mt-2 h-12 px-10 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.22em] uppercase rounded-full hover:bg-accent/90 transition-colors flex items-center gap-2"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Continuar
                      </button>
                    </motion.div>
                  )}

                  {/* PIX PENDENTE */}
                  {phase === "pix-pending" && pixData && (
                    <motion.div
                      key="pix-pending"
                      {...fadeSlide}
                      className="space-y-5"
                    >
                      <div className="text-center space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-accent">
                            Aguardando · {fmtCountdown()}
                          </p>
                        </div>
                        <p className="text-[12px] text-muted-foreground pt-1">
                          Escaneie o QR ou copie o código abaixo
                        </p>
                      </div>

                      {/* QR Code com moldura champagne */}
                      <div className="relative mx-auto w-fit">
                        <div className="absolute -inset-1 bg-gradient-to-br from-accent/30 to-accent/10 rounded-2xl blur-md" />
                        <div className="relative bg-white p-4 rounded-2xl shadow-xl">
                          <img
                            src={`data:image/png;base64,${pixData.qr_code_base64}`}
                            alt="QR Code Pix"
                            className="w-52 h-52 block"
                          />
                        </div>
                      </div>

                      {/* Copiar código */}
                      <div className="space-y-2">
                        <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center">
                          ou copie e cole no app do banco
                        </p>
                        <button
                          onClick={handleCopyPix}
                          className="w-full h-12 rounded-xl bg-foreground text-background font-sans text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
                        >
                          {copied ? (
                            <><Check className="h-4 w-4" /> Código copiado</>
                          ) : (
                            <><Copy className="h-4 w-4" /> Copiar código Pix</>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 justify-center pt-1">
                        <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                        <p className="text-[11px] text-muted-foreground">
                          Confirmando pagamento automaticamente
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* REJEITADO */}
                  {phase === "rejected" && (
                    <motion.div
                      key="rejected"
                      {...fadeSlide}
                      className="py-10 flex flex-col items-center gap-4 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                        <AlertCircle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1.5 max-w-xs">
                        <h3 className="font-serif text-xl text-foreground">
                          Não foi possível processar
                        </h3>
                        {errorMsg && (
                          <p className="text-[13px] text-muted-foreground">{errorMsg}</p>
                        )}
                      </div>
                      <button
                        onClick={() => { setPhase("form"); setErrorMsg(null); }}
                        className="mt-2 h-12 px-10 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.22em] uppercase rounded-full hover:bg-accent/90 transition-colors"
                      >
                        Tentar novamente
                      </button>
                    </motion.div>
                  )}

                  {/* FORM PIX */}
                  {phase === "form" && tab === "pix" && (
                    <motion.div
                      key="form-pix"
                      {...fadeSlide}
                      className="space-y-3.5"
                    >
                      <Field
                        label="Nome completo"
                        value={pixForm.name}
                        onChange={(v) => setPixForm({ ...pixForm, name: v })}
                        placeholder="Como aparece no documento"
                      />
                      <Field
                        label="E-mail"
                        type="email"
                        value={pixForm.email}
                        onChange={(v) => setPixForm({ ...pixForm, email: v })}
                        placeholder="voce@email.com"
                      />
                      <Field
                        label="CPF"
                        value={pixForm.cpf}
                        maxLength={14}
                        onChange={(v) => setPixForm({ ...pixForm, cpf: maskCPF(v) })}
                        placeholder="000.000.000-00"
                      />
                      <button
                        onClick={submitPix}
                        className="w-full h-13 mt-5 bg-foreground text-background font-sans text-[11px] tracking-[0.24em] uppercase rounded-full hover:bg-foreground/90 active:scale-[0.985] transition-all flex items-center justify-center gap-2"
                      >
                        <QrCode className="h-4 w-4" />
                        Gerar Pix
                      </button>
                    </motion.div>
                  )}

                  {/* FORM CARTÃO */}
                  {phase === "form" && tab === "card" && (
                    <motion.div
                      key="form-card"
                      {...fadeSlide}
                      className="space-y-3.5"
                    >
                      <Field
                        label="Número do cartão"
                        value={cardForm.cardNumber}
                        maxLength={19}
                        onChange={(v) => setCardForm({ ...cardForm, cardNumber: maskCard(v) })}
                        placeholder="0000 0000 0000 0000"
                      />
                      <Field
                        label="Nome impresso"
                        value={cardForm.cardholderName}
                        onChange={(v) =>
                          setCardForm({ ...cardForm, cardholderName: v.toUpperCase() })
                        }
                        placeholder="COMO ESTÁ NO CARTÃO"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="Validade"
                          value={cardForm.expiry}
                          maxLength={5}
                          onChange={(v) => setCardForm({ ...cardForm, expiry: maskExpiry(v) })}
                          placeholder="MM/AA"
                        />
                        <Field
                          label="CVV"
                          value={cardForm.cvv}
                          maxLength={4}
                          onChange={(v) =>
                            setCardForm({ ...cardForm, cvv: v.replace(/\D/g, "") })
                          }
                          placeholder="000"
                        />
                      </div>
                      <Field
                        label="CPF do titular"
                        value={cardForm.cpf}
                        maxLength={14}
                        onChange={(v) => setCardForm({ ...cardForm, cpf: maskCPF(v) })}
                        placeholder="000.000.000-00"
                      />
                      <Field
                        label="E-mail"
                        type="email"
                        value={cardForm.email}
                        onChange={(v) => setCardForm({ ...cardForm, email: v })}
                        placeholder="voce@email.com"
                      />

                      {/* Parcelas */}
                      <div>
                        <label className="block font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground/80 mb-2">
                          Parcelamento
                        </label>
                        <select
                          value={cardForm.installments}
                          onChange={(e) =>
                            setCardForm({ ...cardForm, installments: Number(e.target.value) })
                          }
                          className="w-full h-12 px-4 rounded-xl bg-secondary/70 border border-border/60 text-[13px] text-foreground focus:outline-none focus:border-accent/60 focus:bg-card transition-all cursor-pointer"
                        >
                          {installmentOptions.map((n) => (
                            <option key={n} value={n}>
                              {n}x de {formatPrice(amount / n)}
                              {n <= 3 ? " · sem juros" : " · com juros"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={submitCard}
                        className="w-full h-13 mt-5 bg-foreground text-background font-sans text-[11px] tracking-[0.24em] uppercase rounded-full hover:bg-foreground/90 active:scale-[0.985] transition-all flex items-center justify-center gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        Pagar {formatPrice(amount)}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ════════ FOOTER · trust ════════ */}
            {(phase === "form" || phase === "pix-pending") && (
              <div className="px-6 py-3.5 border-t border-border/60 flex-shrink-0 bg-secondary/30">
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-muted-foreground/70" />
                  <p className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground/80">
                    Pagamento criptografado · Mercado Pago
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ═══════════════ Field component ═══════════════ */
const Field = ({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) => (
  <div className="group">
    <label className="block font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground/80 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full h-12 px-4 rounded-xl
        bg-secondary/70 border border-border/60
        text-[14px] text-foreground placeholder:text-muted-foreground/40
        focus:outline-none focus:border-accent/60 focus:bg-card focus:ring-2 focus:ring-accent/15
        transition-all duration-150
      "
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

const maskCard = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
};

const maskExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
};

export default NativeCheckoutDialog;
