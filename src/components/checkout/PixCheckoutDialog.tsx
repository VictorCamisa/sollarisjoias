import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Loader2, CheckCircle2, Clock } from "lucide-react";

interface PixCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  description?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderId?: string;
  onPaid?: () => void;
}

interface PixData {
  id: string;
  mp_payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url?: string;
  amount: number;
  expires_at: string;
}

const PixCheckoutDialog = ({
  open,
  onOpenChange,
  amount,
  description,
  customerName,
  customerPhone,
  customerEmail,
  orderId,
  onPaid,
}: PixCheckoutDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixData | null>(null);
  const [status, setStatus] = useState<"pending" | "paid" | "expired" | "cancelled">("pending");
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Cria pix ao abrir
  useEffect(() => {
    if (!open) {
      setPix(null);
      setStatus("pending");
      return;
    }
    if (pix) return;

    const createPix = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("mercadopago-pix-create", {
          body: {
            amount,
            description: description || "Compra Sollaris",
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            order_id: orderId,
            expires_in_minutes: 30,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setPix(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao gerar Pix";
        toast.error(msg);
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    createPix();
  }, [open]);

  // Polling status
  useEffect(() => {
    if (!pix || status === "paid") return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("pix_transactions")
        .select("status")
        .eq("id", pix.id)
        .maybeSingle();
      if (data?.status === "paid") {
        setStatus("paid");
        toast.success("Pagamento confirmado! 🎉");
        onPaid?.();
        clearInterval(interval);
      } else if (data?.status === "cancelled") {
        setStatus("cancelled");
        clearInterval(interval);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [pix, status]);

  // Countdown
  useEffect(() => {
    if (!pix) return;
    const update = () => {
      const diff = new Date(pix.expires_at).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(diff / 1000)));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [pix]);

  const handleCopy = () => {
    if (!pix?.qr_code) return;
    navigator.clipboard.writeText(pix.qr_code);
    setCopied(true);
    toast.success("Código Pix copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Pagamento via Pix</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
          </div>
        )}

        {!loading && pix && status === "pending" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl font-medium">{formatPrice(pix.amount)}</p>

            {pix.qr_code_base64 && (
              <div className="bg-white p-3 rounded-lg">
                <img
                  src={`data:image/png;base64,${pix.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="w-56 h-56"
                />
              </div>
            )}

            <button
              onClick={handleCopy}
              className="w-full h-11 bg-accent text-accent-foreground rounded-full text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar código Pix"}
            </button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Expira em {minutes}:{seconds.toString().padStart(2, "0")}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Abra o app do seu banco, escaneie o QR Code ou cole o código copia-e-cola.
              <br />
              Esta tela atualiza automaticamente quando o pagamento for confirmado.
            </p>
          </div>
        )}

        {status === "paid" && (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-lg font-medium">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">Obrigada pela sua compra ✨</p>
          </div>
        )}

        {status === "cancelled" && (
          <div className="flex flex-col items-center py-8 gap-3">
            <p className="text-lg font-medium">Pagamento cancelado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixCheckoutDialog;
