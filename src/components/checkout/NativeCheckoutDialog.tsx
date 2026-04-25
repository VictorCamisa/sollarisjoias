import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
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

/* Carrega o SDK MP uma vez */
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

  // form cartão
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardholderName: "",
    expiry: "",
    cvv: "",
    cpf: "",
    email: customerEmail || "",
    installments: 1,
  });

  // pix form
  const [pixForm, setPixForm] = useState({
    cpf: "",
    email: customerEmail || "",
    name: customerName || "",
  });

  const mpRef = useRef<any>(null);
  const pollRef = useRef<number | null>(null);

  // Reset ao abrir
  useEffect(() => {
    if (!open) return;
    setTab("pix");
    setPhase("form");
    setErrorMsg(null);
    setPixData(null);
    setCopied(false);
    setCountdown(30 * 60);
  }, [open]);

  // Inicializa SDK MP
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

  // Lock scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Countdown Pix
  useEffect(() => {
    if (phase !== "pix-pending") return;
    const t = window.setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  // Polling status Pix
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

  /* Submit Pix */
  const submitPix = async () => {
    setErrorMsg(null);
    const cpf = cleanDigits(pixForm.cpf);
    if (cpf.length !== 11) return setErrorMsg("CPF inválido");
    if (!pixForm.email.includes("@")) return setErrorMsg("Email inválido");
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

  /* Submit Cartão */
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
    if (!cardForm.email.includes("@")) return setErrorMsg("Email inválido");
    if (!mpRef.current) return setErrorMsg("SDK não carregado");

    setPhase("processing");
    try {
      // Tokenizar cartão via SDK
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

      // Identifica payment_method_id (visa, master, etc) via SDK
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

  // Parcelas: 1-3x sem juros, 4-12x com juros (display info)
  const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={phase === "form" || phase === "rejected" ? onClose : undefined}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md max-h-[90vh] bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-sans text-[11px] tracking-[0.25em] uppercase text-foreground">
                Pagamento
              </h2>
              <button
                onClick={onClose}
                disabled={phase === "processing"}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Total */}
            <div className="px-6 py-4 border-b border-border flex-shrink-0 flex items-center justify-between">
              <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Total
              </span>
              <span className="font-serif text-2xl text-accent">{formatPrice(amount)}</span>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Tabs */}
              {phase === "form" && (
                <div className="grid grid-cols-2 border-b border-border sticky top-0 bg-card z-10">
                  {(["pix", "card"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`py-3.5 font-sans text-[11px] tracking-[0.2em] uppercase transition-colors ${
                        tab === t
                          ? "text-accent border-b-2 border-accent"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "pix" ? "Pix" : "Cartão"}
                    </button>
                  ))}
                </div>
              )}

              <div className="px-6 py-5">
                {/* Erro */}
                {errorMsg && phase !== "approved" && (
                  <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{errorMsg}</p>
                  </div>
                )}

                {/* PROCESSANDO */}
                {phase === "processing" && (
                  <div className="py-12 flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-accent animate-spin" />
                    <p className="font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground">
                      Processando pagamento
                    </p>
                  </div>
                )}

                {/* APROVADO */}
                {phase === "approved" && (
                  <div className="py-10 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="font-serif text-xl text-foreground">Pagamento aprovado</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Seu pedido foi confirmado. Em breve entraremos em contato.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-4 h-11 px-8 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full"
                    >
                      Fechar
                    </button>
                  </div>
                )}

                {/* PIX PENDENTE */}
                {phase === "pix-pending" && pixData && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                        Aguardando pagamento • {fmtCountdown()}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl flex justify-center">
                      <img
                        src={`data:image/png;base64,${pixData.qr_code_base64}`}
                        alt="QR Code Pix"
                        className="w-56 h-56"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center">
                        Ou copie o código
                      </p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={pixData.qr_code}
                          className="flex-1 h-10 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground font-mono truncate"
                        />
                        <button
                          onClick={handleCopyPix}
                          className="h-10 px-4 rounded-lg bg-accent text-accent-foreground flex items-center gap-1.5 text-xs"
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-center pt-2">
                      <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                      <p className="text-[10px] text-muted-foreground">
                        Confirmação automática
                      </p>
                    </div>
                  </div>
                )}

                {/* REJEITADO */}
                {phase === "rejected" && (
                  <div className="py-8 flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <h3 className="font-serif text-lg text-foreground">Não foi possível processar</h3>
                    <button
                      onClick={() => { setPhase("form"); setErrorMsg(null); }}
                      className="mt-2 h-11 px-8 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {/* FORM PIX */}
                {phase === "form" && tab === "pix" && (
                  <div className="space-y-3">
                    <Field
                      label="Nome completo"
                      value={pixForm.name}
                      onChange={(v) => setPixForm({ ...pixForm, name: v })}
                    />
                    <Field
                      label="E-mail"
                      type="email"
                      value={pixForm.email}
                      onChange={(v) => setPixForm({ ...pixForm, email: v })}
                    />
                    <Field
                      label="CPF"
                      value={pixForm.cpf}
                      maxLength={14}
                      onChange={(v) => setPixForm({ ...pixForm, cpf: maskCPF(v) })}
                    />
                    <button
                      onClick={submitPix}
                      className="w-full h-12 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full mt-4"
                    >
                      Gerar Pix
                    </button>
                  </div>
                )}

                {/* FORM CARTÃO */}
                {phase === "form" && tab === "card" && (
                  <div className="space-y-3">
                    <Field
                      label="Número do cartão"
                      value={cardForm.cardNumber}
                      maxLength={19}
                      onChange={(v) => setCardForm({ ...cardForm, cardNumber: maskCard(v) })}
                    />
                    <Field
                      label="Nome impresso"
                      value={cardForm.cardholderName}
                      onChange={(v) =>
                        setCardForm({ ...cardForm, cardholderName: v.toUpperCase() })
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Validade (MM/AA)"
                        value={cardForm.expiry}
                        maxLength={5}
                        onChange={(v) => setCardForm({ ...cardForm, expiry: maskExpiry(v) })}
                      />
                      <Field
                        label="CVV"
                        value={cardForm.cvv}
                        maxLength={4}
                        onChange={(v) =>
                          setCardForm({ ...cardForm, cvv: v.replace(/\D/g, "") })
                        }
                      />
                    </div>
                    <Field
                      label="CPF do titular"
                      value={cardForm.cpf}
                      maxLength={14}
                      onChange={(v) => setCardForm({ ...cardForm, cpf: maskCPF(v) })}
                    />
                    <Field
                      label="E-mail"
                      type="email"
                      value={cardForm.email}
                      onChange={(v) => setCardForm({ ...cardForm, email: v })}
                    />

                    {/* Parcelas */}
                    <div>
                      <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        Parcelas
                      </label>
                      <select
                        value={cardForm.installments}
                        onChange={(e) =>
                          setCardForm({ ...cardForm, installments: Number(e.target.value) })
                        }
                        className="w-full h-11 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground"
                      >
                        {installmentOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}x de {formatPrice(amount / n)}
                            {n <= 3 ? " sem juros" : " com juros"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={submitCard}
                      className="w-full h-12 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full mt-4"
                    >
                      Pagar {formatPrice(amount)}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer marca MP */}
            {phase === "form" && (
              <div className="px-6 py-3 border-t border-border flex items-center justify-center gap-1.5 flex-shrink-0">
                <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                  Pagamento seguro via Mercado Pago
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ---------- Helpers UI ---------- */
const Field = ({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
}) => (
  <div>
    <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
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
